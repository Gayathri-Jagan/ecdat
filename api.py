"""
ECDAT API layer — wraps scanner, cert_scanner, lib_scanner, scoring,
cbom_export, auth as HTTP endpoints.
Run: python api.py  (serves on http://127.0.0.1:5000)
"""

import json, os
from functools import wraps
from flask import Flask, request, jsonify, send_file, g
from flask_cors import CORS

import auth
import scanner
import cert_scanner
import lib_scanner
import scoring
import cbom_export

import shutil
import subprocess
import tempfile
import zipfile
import tarfile
import uuid

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

DATA_DIR = "data"
OUTPUT_DIR = "output"
TARGETS_DIR = "targets"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TARGETS_DIR, exist_ok=True)


def require_auth(role=None):
    def wrapper(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            if not header.startswith("Bearer "):
                return jsonify({"error": "Missing token"}), 401
            token = header[7:]
            payload, err = auth.verify_token(token)
            if err:
                return jsonify({"error": err}), 401
            if role and payload.get("role") != role:
                return jsonify({"error": "Insufficient role"}), 403
            g.user = payload
            return fn(*args, **kwargs)
        return inner
    return wrapper


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "viewer")
    if not username or len(password) < 8:
        return jsonify({"error": "Username required, password must be >= 8 chars"}), 400
    ok, msg = auth.register(username, password, role=role)
    if not ok:
        return jsonify({"error": msg}), 400
    return jsonify({"message": msg}), 201


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    token, msg = auth.login(username, password)
    if not token:
        return jsonify({"error": msg}), 401
    users = auth.load_users()
    return jsonify({
        "token": token,
        "user": {"username": username, "role": users[username]["role"]}
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@require_auth()
def api_me():
    return jsonify(g.user), 200


@app.route("/api/scans/start", methods=["POST"])
@require_auth(role="admin")
def api_scan_start():
    # 1. Source code
    patterns = scanner.load_patterns(os.path.join(DATA_DIR, "crypto_algorithms.json"))
    source_findings = scanner.scan_directory(TARGETS_DIR, patterns)
    for f in source_findings:
        f["source_type"] = "source"

    # 2. Certificates / keys
    cert_findings = cert_scanner.scan_directory(TARGETS_DIR)

    # 3. Libraries / manifests
    lib_findings = lib_scanner.scan_directory(TARGETS_DIR)

    all_findings = source_findings + cert_findings + lib_findings

    # 4. Business criticality from request
    req = request.get_json(silent=True) or {}
    business_crit = req.get("business_criticality", "Medium")
    if business_crit not in ("Low", "Medium", "High", "Critical"):
        business_crit = "Medium"

    assumptions = {
        "t_shelf_years": 10,
        "t_migration_years": 3,
        "t_threat_years": 12,
        "business_criticality": business_crit
    }
    scored = scoring.score_all(all_findings, assumptions)

    with open(os.path.join(OUTPUT_DIR, "findings.json"), "w", encoding="utf-8") as f:
        json.dump(all_findings, f, indent=2)
    with open(os.path.join(OUTPUT_DIR, "scored.json"), "w", encoding="utf-8") as f:
        json.dump(scored, f, indent=2)

    auth.audit(
        g.user["sub"],
        "scan_started",
        f"source={len(source_findings)} cert={len(cert_findings)} lib={len(lib_findings)} total={len(scored)} criticality={business_crit}"
    )

    return jsonify({
        "message": "Scan complete",
        "findings": len(scored),
        "source": len(source_findings),
        "certs": len(cert_findings),
        "libraries": len(lib_findings),
        "critical": sum(1 for s in scored if s["tier"] == "Critical"),
        "high": sum(1 for s in scored if s["tier"] == "High")
    }), 200


@app.route("/api/scans/latest", methods=["GET"])
@require_auth()
def api_scan_latest():
    path = os.path.join(OUTPUT_DIR, "scored.json")
    if not os.path.exists(path):
        return jsonify({"findings": []}), 200
    with open(path, encoding="utf-8") as f:
        return jsonify({"findings": json.load(f)}), 200


@app.route("/api/cbom/export", methods=["POST"])
@require_auth()
def api_cbom_export():
    scored_path = os.path.join(OUTPUT_DIR, "scored.json")
    if not os.path.exists(scored_path):
        return jsonify({"error": "No scan results yet"}), 400
    with open(scored_path, encoding="utf-8") as f:
        scored = json.load(f)
    cbom = cbom_export.to_cbom(scored)
    out_path = os.path.join(OUTPUT_DIR, "cbom.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(cbom, f, indent=2)
    auth.audit(g.user["sub"], "cbom_exported", f"components={len(cbom['components'])}")
    return jsonify(cbom), 200


@app.route("/api/cbom/latest", methods=["GET"])
@require_auth()
def api_cbom_latest():
    path = os.path.join(OUTPUT_DIR, "cbom.json")
    if not os.path.exists(path):
        return jsonify({"components": []}), 200
    with open(path, encoding="utf-8") as f:
        return jsonify(json.load(f)), 200


@app.route("/api/cbom/download", methods=["GET"])
@require_auth()
def api_cbom_download():
    path = os.path.join(OUTPUT_DIR, "cbom.json")
    if not os.path.exists(path):
        return jsonify({"error": "No CBOM available"}), 404
    return send_file(path, as_attachment=True, download_name="ecdat-cbom.json")


@app.route("/api/scans/upload-zip", methods=["POST"])
@require_auth(role="admin")
def api_scan_upload_zip():
    """Accept a ZIP file, unzip to targets/uploads/<uuid>/, scan it."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    upload = request.files["file"]
    if not upload.filename.lower().endswith(".zip"):
        return jsonify({"error": "Only .zip files accepted"}), 400

    scan_id = str(uuid.uuid4())
    scan_dir = os.path.join(TARGETS_DIR, "uploads", scan_id)
    os.makedirs(scan_dir, exist_ok=True)

    zip_path = os.path.join(scan_dir, "_upload.zip")
    upload.save(zip_path)

    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(scan_dir)
        os.remove(zip_path)
    except zipfile.BadZipFile:
        shutil.rmtree(scan_dir, ignore_errors=True)
        return jsonify({"error": "Invalid ZIP archive"}), 400

    business_crit = request.form.get("business_criticality", "Medium")
    if business_crit not in ("Low", "Medium", "High", "Critical"):
        business_crit = "Medium"

    return _run_scan_on_dir(scan_dir, business_crit, f"zip:{upload.filename}")


@app.route("/api/scans/git-clone", methods=["POST"])
@require_auth(role="admin")
def api_scan_git_clone():
    """Clone a public Git repo to targets/clones/<uuid>/ and scan it."""
    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    business_crit = data.get("business_criticality", "Medium")

    if not url or not (url.startswith("http://") or url.startswith("https://") or url.startswith("git@")):
        return jsonify({"error": "Provide a valid Git URL (https://... or git@...)"}), 400

    if business_crit not in ("Low", "Medium", "High", "Critical"):
        business_crit = "Medium"

    scan_id = str(uuid.uuid4())
    scan_dir = os.path.join(TARGETS_DIR, "clones", scan_id)
    os.makedirs(scan_dir, exist_ok=True)

    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, scan_dir],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            shutil.rmtree(scan_dir, ignore_errors=True)
            return jsonify({"error": f"Git clone failed: {result.stderr.strip()[:200]}"}), 400
    except FileNotFoundError:
        shutil.rmtree(scan_dir, ignore_errors=True)
        return jsonify({"error": "git is not installed on this machine"}), 500
    except subprocess.TimeoutExpired:
        shutil.rmtree(scan_dir, ignore_errors=True)
        return jsonify({"error": "Git clone timed out after 120s"}), 408

    # Remove .git to avoid scanning internal refs
    git_dir = os.path.join(scan_dir, ".git")
    if os.path.isdir(git_dir):
        shutil.rmtree(git_dir, ignore_errors=True)

    return _run_scan_on_dir(scan_dir, business_crit, f"git:{url}")


@app.route("/api/scans/container", methods=["POST"])
@require_auth(role="admin")
def api_scan_container():
    """
    Accept a container image name. Uses `docker save` to export the image
    filesystem, extracts it, then scans. Falls back gracefully if docker
    is not installed.
    """
    data = request.get_json(silent=True) or {}
    image = (data.get("image") or "").strip()
    business_crit = data.get("business_criticality", "Medium")

    if not image:
        return jsonify({"error": "Provide a container image name (e.g., nginx:latest)"}), 400

    if business_crit not in ("Low", "Medium", "High", "Critical"):
        business_crit = "Medium"

    scan_id = str(uuid.uuid4())
    scan_dir = os.path.join(TARGETS_DIR, "containers", scan_id)
    os.makedirs(scan_dir, exist_ok=True)

    tar_path = os.path.join(scan_dir, "_image.tar")
    try:
        result = subprocess.run(
            ["docker", "save", "-o", tar_path, image],
            capture_output=True, text=True, timeout=180
        )
        if result.returncode != 0:
            shutil.rmtree(scan_dir, ignore_errors=True)
            return jsonify({
                "error": f"docker save failed: {result.stderr.strip()[:200]}. "
                         f"Ensure Docker is running and the image exists locally."
            }), 400
    except FileNotFoundError:
        shutil.rmtree(scan_dir, ignore_errors=True)
        return jsonify({"error": "Docker is not installed on this machine"}), 500
    except subprocess.TimeoutExpired:
        shutil.rmtree(scan_dir, ignore_errors=True)
        return jsonify({"error": "docker save timed out after 180s"}), 408

    # Extract the tar (contains layer tarballs). We unzip nested layers too.
    try:
        extract_dir = os.path.join(scan_dir, "_extracted")
        os.makedirs(extract_dir, exist_ok=True)
        with tarfile.open(tar_path, "r") as t:
            t.extractall(extract_dir)
        os.remove(tar_path)

        # Extract each layer tarball
        for root, _, files in os.walk(extract_dir):
            for fname in files:
                if fname.endswith(".tar"):
                    layer_path = os.path.join(root, fname)
                    layer_out = os.path.join(extract_dir, fname.replace(".tar", "_extracted"))
                    os.makedirs(layer_out, exist_ok=True)
                    try:
                        with tarfile.open(layer_path, "r") as lt:
                            lt.extractall(layer_out)
                    except Exception:
                        continue
    except Exception as e:
        shutil.rmtree(scan_dir, ignore_errors=True)
        return jsonify({"error": f"Failed to extract image layers: {str(e)[:200]}"}), 500

    return _run_scan_on_dir(extract_dir, business_crit, f"container:{image}")


def _run_scan_on_dir(scan_dir, business_crit, source_label):
    """Shared helper: run all 3 scanners on a directory and score the result."""
    patterns = scanner.load_patterns(os.path.join(DATA_DIR, "crypto_algorithms.json"))
    source_findings = scanner.scan_directory(scan_dir, patterns)
    for f in source_findings:
        f["source_type"] = "source"

    cert_findings = cert_scanner.scan_directory(scan_dir)
    lib_findings = lib_scanner.scan_directory(scan_dir)

    all_findings = source_findings + cert_findings + lib_findings

    assumptions = {
        "t_shelf_years": 10,
        "t_migration_years": 3,
        "t_threat_years": 12,
        "business_criticality": business_crit
    }
    scored = scoring.score_all(all_findings, assumptions)

    with open(os.path.join(OUTPUT_DIR, "findings.json"), "w", encoding="utf-8") as f:
        json.dump(all_findings, f, indent=2)
    with open(os.path.join(OUTPUT_DIR, "scored.json"), "w", encoding="utf-8") as f:
        json.dump(scored, f, indent=2)

    auth.audit(
        g.user["sub"],
        "scan_started",
        f"source={source_label} total={len(scored)} criticality={business_crit}"
    )

    return jsonify({
        "message": "Scan complete",
        "source_label": source_label,
        "findings": len(scored),
        "source": len(source_findings),
        "certs": len(cert_findings),
        "libraries": len(lib_findings),
        "critical": sum(1 for s in scored if s["tier"] == "Critical"),
        "high": sum(1 for s in scored if s["tier"] == "High")
    }), 200
@app.route("/api/audit", methods=["GET"])
@require_auth()
def api_audit():
    path = os.path.join(OUTPUT_DIR, "audit.log")
    if not os.path.exists(path):
        return jsonify({"entries": []}), 200
    entries = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return jsonify({"entries": entries[::-1]}), 200


if __name__ == "__main__":
    print("ECDAT API running on http://127.0.0.1:5000")
    print("  Scanners: source, certificates, libraries")
    app.run(host="127.0.0.1", port=5000, debug=True)