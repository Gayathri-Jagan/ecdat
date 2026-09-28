import json, os

def load_nist(path="data/nist_status.json"):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def get_nist_status(entry, key_size):
    """Look up NIST status for an algorithm, using key_size if thresholds exist."""
    if "key_size_thresholds" in entry:
        ks = str(key_size) if key_size else None
        if ks and ks in entry["key_size_thresholds"]:
            t = entry["key_size_thresholds"][ks]
            return t["current"], t["2030"], t["2035"]
        else:
            # unknown key size — use the lowest threshold as worst-case
            lowest = sorted(entry["key_size_thresholds"].keys(), key=int)[0]
            t = entry["key_size_thresholds"][lowest]
            return t["current"], t["2030"], t["2035"]
    else:
        return (
            entry.get("current_status", "unknown"),
            entry.get("status_2030", "unknown"),
            entry.get("status_2035", "unknown")
        )

def score_finding(finding, nist, assumptions):
    algo = finding["algorithm"]
    entry = nist["algorithms"].get(algo, {})
    key_size = finding.get("key_size")

    current_status, status_2030, status_2035 = get_nist_status(entry, key_size)
    qv = entry.get("quantum_vulnerable", False)
    legacy_ok = entry.get("legacy_use_allowed", True)

    t_shelf = assumptions.get("t_shelf_years", 10)
    t_migration = assumptions.get("t_migration_years", 3)
    t_threat = assumptions.get("t_threat_years", 12)
    business_criticality = assumptions.get("business_criticality", "Medium")

    time_exposed = qv and ((t_shelf + t_migration) > t_threat)

    score = 0
    if current_status == "disallowed":  score += 40
    elif current_status == "deprecated": score += 25
    elif current_status == "approved":   score += 5
    else:                                score += 15

    if qv: score += 30
    if time_exposed: score += 25
    if not legacy_ok: score += 10

    # Business criticality amplifier
    if business_criticality == "Critical":   score = int(score * 1.20)
    elif business_criticality == "High":     score = int(score * 1.10)
    elif business_criticality == "Low":      score = int(score * 0.85)
    # Medium = no change

    if finding.get("confidence") == "low":    score = int(score * 0.6)
    elif finding.get("confidence") == "medium": score = int(score * 0.85)

    score = max(0, min(score, 100))

    if score >= 70:   tier = "Critical"
    elif score >= 50: tier = "High"
    elif score >= 30: tier = "Medium"
    else:             tier = "Low"

    return {
        **finding,
        "nist_status_current": current_status,
        "nist_status_2030": status_2030,
        "nist_status_2035": status_2035,
        "quantum_vulnerable": qv,
        "legacy_use_allowed": legacy_ok,
        "time_exposed": time_exposed,
        "risk_score": score,
        "tier": tier,
        "t_shelf": t_shelf,
        "t_migration": t_migration,
        "t_threat": t_threat,
        "business_criticality": business_criticality,
        "pqc_replacement": entry.get("pqc_replacement", None),
        "nist_reference": entry.get("nist_reference", None)
    }
def score_all(findings, assumptions=None):
    nist = load_nist()
    assumptions = assumptions or {}
    scored = [score_finding(f, nist, assumptions) for f in findings]
    return sorted(scored, key=lambda x: x["risk_score"], reverse=True)

if __name__ == "__main__":
    with open("output/findings.json", encoding="utf-8") as f:
        findings = json.load(f)

    assumptions = {"t_shelf_years": 10, "t_migration_years": 3, "t_threat_years": 12}
    scored = score_all(findings, assumptions)

    os.makedirs("output", exist_ok=True)
    with open("output/scored.json", "w", encoding="utf-8") as f:
        json.dump(scored, f, indent=2)

    print(f"Scored {len(scored)} findings\n")
    print(f"{'Score':<6}{'Tier':<10}{'Algo':<10}{'Key':<8}{'Status':<14}{'TimeExp':<10}File")
    print("-" * 80)
    for s in scored:
        ks = str(s['key_size']) if s['key_size'] else "-"
        te = "YES" if s['time_exposed'] else "no"
        print(f"{s['risk_score']:<6}{s['tier']:<10}{s['algorithm']:<10}{ks:<8}{s['nist_status_current']:<14}{te:<10}{s['file']}:{s['line']}")