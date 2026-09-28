"""
Certificate scanner — reads PEM/CRT/CER/KEY files and extracts
cryptographic properties (algorithm, key size, signature algo, expiry).
Produces findings in the same shape as scanner.py so downstream
scoring and CBOM export work unchanged.
"""

import os, re, uuid, json
from pathlib import Path
from datetime import datetime, timezone

try:
    from cryptography import x509
    from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, ed448
    from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False


CERT_EXTS = {".pem", ".crt", ".cer", ".cert"}


def _detect_from_pem_text(text, path):
    """Fallback detection when cryptography lib unavailable or parse fails."""
    findings = []
    upper = text.upper()

    if "BEGIN CERTIFICATE" in upper or "BEGIN RSA" in upper or "BEGIN EC" in upper:
        # Try to guess key size from base64 length (rough)
        sig_algo = None
        if "SHA1" in upper or "SHA-1" in upper:
            sig_algo = "SHA-1"
        elif "SHA256" in upper or "SHA-256" in upper:
            sig_algo = "SHA-256"

        findings.append({
            "id": str(uuid.uuid4()),
            "algorithm": "RSA" if "BEGIN RSA" in upper else ("ECDSA" if "BEGIN EC" in upper else "Certificate"),
            "algorithm_id": "cert-unknown",
            "category": "certificate",
            "key_size": None,
            "file": str(path),
            "line": 1,
            "match": "PEM block detected",
            "confidence": "low",
            "detection_method": "cert_fallback",
            "source_type": "certificate",
            "extra": {"signature_algorithm": sig_algo}
        })
    return findings


def _classify_key(key):
    """Return (algorithm_name, key_size_bits) for a cryptography key object."""
    if isinstance(key, rsa.RSAPrivateKey) or isinstance(key, rsa.RSAPublicKey):
        return "RSA", key.key_size
    if isinstance(key, ec.EllipticCurvePrivateKey) or isinstance(key, ec.EllipticCurvePublicKey):
        return "ECDSA", key.curve.key_size
    if isinstance(key, ed25519.Ed25519PrivateKey) or isinstance(key, ed25519.Ed25519PublicKey):
        return "Ed25519", 256
    if isinstance(key, ed448.Ed448PrivateKey) or isinstance(key, ed448.Ed448PublicKey):
        return "Ed448", 456
    return None, None


def scan_cert_file(filepath):
    findings = []
    try:
        data = Path(filepath).read_bytes()
    except Exception:
        return findings

    text = data.decode("utf-8", errors="ignore")

    # Try to parse as certificate
    if HAS_CRYPTO and b"BEGIN CERTIFICATE" in data:
        try:
            cert = x509.load_pem_x509_certificate(data)
            pub = cert.public_key()
            algo, key_size = _classify_key(pub)
            sig_algo = cert.signature_hash_algorithm.name.upper() if cert.signature_hash_algorithm else None

            # Expiry
            expiry = cert.not_valid_after_utc if hasattr(cert, "not_valid_after_utc") else cert.not_valid_after
            now = datetime.now(timezone.utc)
            days_left = (expiry - now).days

            findings.append({
                "id": str(uuid.uuid4()),
                "algorithm": algo or "Certificate",
                "algorithm_id": f"cert-{algo.lower()}" if algo else "cert-unknown",
                "category": "certificate",
                "key_size": key_size,
                "file": str(filepath),
                "line": 1,
                "match": f"X.509 cert ({sig_algo})",
                "confidence": "high",
                "detection_method": "x509_parse",
                "source_type": "certificate",
                "extra": {
                    "signature_algorithm": sig_algo,
                    "subject": cert.subject.rfc4514_string(),
                    "issuer": cert.issuer.rfc4514_string(),
                    "expires": expiry.isoformat(),
                    "days_until_expiry": days_left,
                    "expired": days_left < 0
                }
            })
            return findings
        except Exception:
            pass

    # Try to parse as private key
    if HAS_CRYPTO and b"PRIVATE KEY" in data:
        try:
            key = load_pem_private_key(data, password=None)
            algo, key_size = _classify_key(key)
            if algo:
                findings.append({
                    "id": str(uuid.uuid4()),
                    "algorithm": algo,
                    "algorithm_id": f"cert-{algo.lower()}",
                    "category": "private_key",
                    "key_size": key_size,
                    "file": str(filepath),
                    "line": 1,
                    "match": "PEM private key",
                    "confidence": "high",
                    "detection_method": "pem_key_parse",
                    "source_type": "certificate",
                    "extra": {"encrypted": False}
                })
            return findings
        except Exception:
            pass

    # Fallback: text-based detection
    return _detect_from_pem_text(text, filepath)


def scan_directory(root):
    findings = []
    for dirpath, _, files in os.walk(root):
        for f in files:
            ext = Path(f).suffix.lower()
            if ext in CERT_EXTS or f.lower().endswith(".key"):
                findings.extend(scan_cert_file(os.path.join(dirpath, f)))
    return findings


if __name__ == "__main__":
    results = scan_directory("targets")
    print(f"Found {len(results)} certificate/key artefacts")
    for r in results:
        print(f"  {r['algorithm']:<10} key={r['key_size'] or '?'} {r['file']}")