import json, os, re, uuid
from pathlib import Path

def load_patterns(path="data/crypto_algorithms.json"):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def extract_key_size(line_text, algorithm):
    key_size_patterns = {
        "RSA":     [r"RSA\.generate\s*\(\s*(\d{3,5})", r"RSA[-_ ]?(\d{3,5})"],
        "AES":     [r"AES[-_ ]?(\d{3})", r"aes[-_](\d{3})"],
        "ECDSA":   [r"(?:P-?|secp|prime)(\d{3})"],
        "ML-KEM":  [r"ML-?KEM[-_ ]?(\d{3})", r"Kyber[-_ ]?(\d{3})"],
    }
    for p in key_size_patterns.get(algorithm, []):
        m = re.search(p, line_text, re.IGNORECASE)
        if m:
            try:
                size = int(m.group(1))
                if 64 <= size <= 8192:
                    return size
            except (IndexError, ValueError):
                pass
    return None

def scan_file(filepath, patterns):
    findings = []
    try:
        text = Path(filepath).read_text(errors="ignore")
    except Exception:
        return findings

    lines = text.splitlines()

    for algo in patterns:
        for pattern in algo.get("detection_patterns", []):
            try:
                for m in re.finditer(pattern, text, re.IGNORECASE):
                    line_no = text[:m.start()].count("\n") + 1
                    line_text = lines[line_no - 1] if line_no <= len(lines) else ""
                    stripped = line_text.strip()
                    if stripped.startswith(("import ", "from ", "#", "//")):
                    	continue
                    findings.append({
                        "id": str(uuid.uuid4()),
                        "algorithm": algo["name"],
                        "algorithm_id": algo["id"],
                        "category": algo.get("category", "unknown"),
                        "key_size": extract_key_size(line_text, algo["name"]),
                        "file": str(filepath),
                        "line": line_no,
                        "match": m.group(0),
                        "confidence": "medium",
                        "detection_method": "static_regex"
                    })
            except re.error:
                continue
    return findings

def scan_directory(root, patterns):
    findings = []
    seen = set()
    exts = {".py", ".java", ".js", ".ts", ".go", ".c", ".cpp", ".cs", ".rb", ".php"}
    for dirpath, _, files in os.walk(root):
        for f in files:
            if Path(f).suffix in exts:
                for finding in scan_file(os.path.join(dirpath, f), patterns):
                    key = (finding["file"], finding["line"], finding["algorithm"])
                    if key in seen:
                        continue
                    seen.add(key)
                    findings.append(finding)
    return findings

if __name__ == "__main__":
    patterns = load_patterns()
    results = scan_directory("targets", patterns)
    print(f"Found {len(results)} crypto usages")
    os.makedirs("output", exist_ok=True)
    with open("output/findings.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    for r in results[:10]:
        ks = f"key={r['key_size']}" if r['key_size'] else "key=?"
        print(f"  {r['algorithm']:<10} {ks:<10} {r['file']}:{r['line']}")