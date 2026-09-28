import json, uuid
from datetime import datetime, timezone


def finding_to_component(finding):
    """Map one scored finding to a CycloneDX cryptographic-asset component."""
    crypto_props = {
        "assetType": "algorithm",
        "algorithmProperties": {
            "primitive": finding.get("category", "unknown"),
            "parameterSetIdentifier": str(finding.get("key_size") or "")
        }
    }

    properties = [
        {"name": "ecdat:nistStatusCurrent", "value": finding.get("nist_status_current", "unknown")},
        {"name": "ecdat:nistStatus2030",    "value": finding.get("nist_status_2030", "unknown")},
        {"name": "ecdat:nistStatus2035",    "value": finding.get("nist_status_2035", "unknown")},
        {"name": "ecdat:quantumVulnerable", "value": str(finding.get("quantum_vulnerable", False)).lower()},
        {"name": "ecdat:legacyUseAllowed",  "value": str(finding.get("legacy_use_allowed", True)).lower()},
        {"name": "ecdat:timeExposed",       "value": str(finding.get("time_exposed", False)).lower()},
        {"name": "ecdat:riskScore",         "value": str(finding.get("risk_score", 0))},
        {"name": "ecdat:tier",              "value": finding.get("tier", "Unknown")},
        {"name": "ecdat:tShelfYears",       "value": str(finding.get("t_shelf", ""))},
        {"name": "ecdat:tMigrationYears",   "value": str(finding.get("t_migration", ""))},
        {"name": "ecdat:tThreatYears",      "value": str(finding.get("t_threat", ""))},
        {"name": "ecdat:detectionMethod",   "value": finding.get("detection_method", "unknown")},
        {"name": "ecdat:confidence",        "value": finding.get("confidence", "unknown")},
        {"name": "ecdat:location",          "value": f"{finding.get('file','')}:{finding.get('line','')}"},
{"name": "ecdat:businessCriticality", "value": finding.get("business_criticality", "Medium")},
{"name": "ecdat:pqcRecommendation", "value": (finding.get("pqc_replacement") or {}).get("recommendation_kem") or (finding.get("pqc_replacement") or {}).get("recommendation") or (finding.get("pqc_replacement") or {}).get("recommendation_signature") or "—"},
{"name": "ecdat:fips",              "value": (finding.get("pqc_replacement") or {}).get("fips", "—")},
{"name": "ecdat:hybrid",            "value": (finding.get("pqc_replacement") or {}).get("hybrid", "—")}
    ]

    return {
        "type": "cryptographic-asset",
        "bom-ref": finding.get("id", str(uuid.uuid4())),
        "name": finding.get("algorithm", "unknown"),
        "cryptoProperties": crypto_props,
        "properties": properties
    }


def to_cbom(scored_findings):
    components = [finding_to_component(f) for f in scored_findings]

    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": f"urn:uuid:{uuid.uuid4()}",
        "version": 1,
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools": [
                {"vendor": "ECDAT", "name": "Enterprise Cryptographic Discovery and Analysis Tool", "version": "0.1"}
            ],
            "component": {
                "type": "application",
                "name": "ECDAT Scan",
                "version": "0.1"
            }
        },
        "components": components
    }


if __name__ == "__main__":
    with open("output/scored.json", encoding="utf-8") as f:
        scored = json.load(f)

    cbom = to_cbom(scored)

    with open("output/cbom.json", "w", encoding="utf-8") as f:
        json.dump(cbom, f, indent=2)

    print(f"CBOM written: output/cbom.json")
    print(f"  specVersion: {cbom['specVersion']}")
    print(f"  components:  {len(cbom['components'])}")
    for c in cbom["components"]:
        tier = next((p["value"] for p in c["properties"] if p["name"] == "ecdat:tier"), "?")
        print(f"    - {c['name']:<10} tier={tier}")