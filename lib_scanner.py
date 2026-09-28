"""
Library / dependency scanner — reads common manifest files
(requirements.txt, package.json, pom.xml, Gemfile, go.mod, Cargo.toml)
and detects known cryptographic libraries.
Produces findings in the same shape as scanner.py.
"""

import os, re, json, uuid
from pathlib import Path

KNOWN_CRYPTO_LIBS = {
    # Python
    "cryptography":  ("cryptography", "Python crypto library (OpenSSL-backed)"),
    "pycryptodome":  ("PyCryptodome", "Python crypto library (fork of PyCrypto)"),
    "pycrypto":      ("PyCrypto",     "DEPRECATED Python crypto library"),
    "pyopenssl":     ("pyOpenSSL",    "Python wrapper around OpenSSL"),
    "paramiko":      ("Paramiko",     "SSH implementation in Python"),
    "nacl":          ("PyNaCl",       "Python bindings to libsodium"),
    "pynacl":        ("PyNaCl",       "Python bindings to libsodium"),
    "bcrypt":        ("bcrypt",       "Password hashing"),
    "argon2-cffi":   ("argon2-cffi",  "Argon2 password hashing"),
    # JS
    "node-forge":    ("node-forge",   "JavaScript crypto implementation"),
    "crypto-js":     ("crypto-js",    "JavaScript crypto library"),
    "jsonwebtoken":  ("jsonwebtoken", "JWT signing/verification"),
    "bcryptjs":      ("bcryptjs",     "JS bcrypt implementation"),
    "jose":          ("jose",         "JS JOSE/JWT implementation"),
    # Java
    "bcprov":        ("Bouncy Castle","Java crypto provider"),
    "bouncycastle":  ("Bouncy Castle","Java crypto provider"),
    "bouncy-castle": ("Bouncy Castle","Java crypto provider"),
    "openssl":       ("OpenSSL",      "C crypto library"),
    "libsodium":     ("libsodium",    "Modern C crypto library"),
    "boringssl":     ("BoringSSL",    "Google's OpenSSL fork"),
    "wolfssl":       ("wolfSSL",      "Embedded TLS library"),
    "mbedtls":       ("mbedTLS",      "Embedded TLS library"),
}

MANIFEST_FILES = {
    "requirements.txt", "package.json", "pom.xml",
    "gemfile", "go.mod", "cargo.toml", "build.gradle"
}

MANIFEST_EXTS = {".lock", ".txt", ".json", ".xml", ".gradle", ".mod", ".toml"}


def _match_libs(text):
    """Return list of (lib_id, display_name, description) matches."""
    seen = set()
    results = []
    lowered = text.lower()
    for key, (display, desc) in KNOWN_CRYPTO_LIBS.items():
        if key.lower() in lowered and key not in seen:
            seen.add(key)
            results.append((key, display, desc))
    return results


def scan_manifest(filepath):
    findings = []
    try:
        text = Path(filepath).read_text(errors="ignore")
    except Exception:
        return findings

    for lib_key, display, desc in _match_libs(text):
        # Try to extract version number from nearby text
        version = None
        m = re.search(rf"{re.escape(lib_key)}[\"'\s:=@^~><]+([\w.\-]+)", text, re.IGNORECASE)
        if m:
            version = m.group(1)

        findings.append({
            "id": str(uuid.uuid4()),
            "algorithm": display,
            "algorithm_id": f"lib-{lib_key}",
            "category": "library",
            "key_size": None,
            "file": str(filepath),
            "line": text[:m.start()].count("\n") + 1 if m else 1,
            "match": f"{lib_key}@{version}" if version else lib_key,
            "confidence": "high",
            "detection_method": "manifest_scan",
            "source_type": "library",
            "extra": {
                "library": lib_key,
                "version": version,
                "description": desc
            }
        })
    return findings


def scan_directory(root):
    findings = []
    for dirpath, _, files in os.walk(root):
        for f in files:
            fname = f.lower()
            ext = Path(f).suffix.lower()
            if fname in MANIFEST_FILES or (ext in MANIFEST_EXTS and any(
                kw in fname for kw in ("requirements", "package", "gemfile", "go.sum", "cargo", "pom"))
            ):
                findings.extend(scan_manifest(os.path.join(dirpath, f)))
    return findings


if __name__ == "__main__":
    results = scan_directory("targets")
    print(f"Found {len(results)} crypto library references")
    for r in results:
        print(f"  {r['algorithm']:<16} {r['match']:<30} {r['file']}")