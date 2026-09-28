import json, os, jwt, uuid
from datetime import datetime, timezone, timedelta
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

SECRET_KEY = os.environ.get("ECDAT_SECRET", "ecdat-dev-secret-key-change-me-in-production-32b")
TOKEN_TTL_HOURS = 8
USERS_FILE = "data/users.json"
AUDIT_FILE = "output/audit.log"

ph = PasswordHasher()


def _ensure_files():
    os.makedirs("data", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w") as f:
            json.dump({}, f)


def load_users():
    _ensure_files()
    with open(USERS_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)


def register(username, password, role="viewer"):
    users = load_users()
    if username in users:
        return False, "User already exists"
    users[username] = {
        "password_hash": ph.hash(password),
        "role": role,
        "created": datetime.now(timezone.utc).isoformat()
    }
    save_users(users)
    audit(username, "register", f"role={role}")
    return True, "User created"


def login(username, password):
    users = load_users()
    if username not in users:
        audit(username, "login_failed", "unknown_user")
        return None, "Invalid credentials"
    try:
        ph.verify(users[username]["password_hash"], password)
    except VerifyMismatchError:
        audit(username, "login_failed", "wrong_password")
        return None, "Invalid credentials"

    token = jwt.encode(
        {
            "sub": username,
            "role": users[username]["role"],
            "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS),
            "iat": datetime.now(timezone.utc),
            "jti": str(uuid.uuid4())
        },
        SECRET_KEY,
        algorithm="HS256"
    )
    audit(username, "login_success", "")
    return token, "OK"


def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"


def audit(username, action, detail):
    _ensure_files()
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": username,
        "action": action,
        "detail": detail
    }
    with open(AUDIT_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


if __name__ == "__main__":
    # Quick self-test
    ok, msg = register("admin", "StrongPass!2026", role="admin")
    print(f"register: {msg}")
    token, msg = login("admin", "StrongPass!2026")
    print(f"login: {msg}")
    if token:
        payload, err = verify_token(token)
        print(f"verify: user={payload['sub']} role={payload['role']}")
    print(f"audit log written to {AUDIT_FILE}")