import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, Field

from core import db, new_id, now_iso, serialize, rate_limiter, client_ip, log_audit, ROLES

JWT_ALGORITHM = "HS256"
ACCESS_MINUTES = 60 * 8
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_MINUTES),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def _set_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=ACCESS_MINUTES * 60, path="/",
    )


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.admin_users.find_one({"_id": payload["sub"]})
    if not user or not user.get("active", True):
        raise HTTPException(status_code=401, detail="Account unavailable")
    user.pop("password_hash", None)
    return serialize(user)


def require_roles(*allowed: str):
    async def dependency(admin: dict = Depends(get_current_admin)) -> dict:
        if admin["role"] not in allowed:
            raise HTTPException(status_code=403, detail="You do not have permission for this action")
        return admin
    return dependency


require_content = require_roles("super_admin", "content_manager")
require_enquiry = require_roles("super_admin", "enquiry_manager")
require_super = require_roles("super_admin")


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=2, max_length=180)
    password: str = Field(min_length=1, max_length=200)


class AdminUserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=60)
    email: str = Field(min_length=5, max_length=254)
    name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=200)
    role: str = "content_manager"


class AdminUserUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    active: bool | None = None
    password: str | None = None


@auth_router.post("/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    ip = client_ip(request)
    ident = payload.identifier.strip().lower()
    if not rate_limiter.allow(f"login:{ip}", limit=10, window=300):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")

    attempt_key = f"{ip}:{ident}"
    record = await db.login_attempts.find_one({"_id": attempt_key})
    if record and record.get("count", 0) >= 5:
        locked_until = datetime.fromisoformat(record["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Account temporarily locked. Try again in a few minutes.")

    user = await db.admin_users.find_one({"$or": [{"username": ident}, {"email": ident}]})
    if not user or not verify_password(payload.password, user["password_hash"]) or not user.get("active", True):
        count = (record.get("count", 0) if record else 0) + 1
        await db.login_attempts.update_one(
            {"_id": attempt_key},
            {"$set": {"count": count,
                      "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await db.login_attempts.delete_one({"_id": attempt_key})
    token = create_access_token(user["_id"], user["username"], user["role"])
    _set_cookie(response, token)
    await db.admin_users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": now_iso()}})
    user.pop("password_hash", None)
    return {"user": serialize(user), "access_token": token}


@auth_router.post("/logout")
async def logout(response: Response, admin: dict = Depends(get_current_admin)):
    response.delete_cookie("access_token", path="/")
    return {"success": True}


@auth_router.get("/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


@auth_router.get("/users")
async def list_users(admin: dict = Depends(require_super)):
    users = await db.admin_users.find({}, {"password_hash": 0}).sort("created_at", 1).to_list(200)
    return [serialize(u) for u in users]


@auth_router.post("/users")
async def create_user(payload: AdminUserCreate, admin: dict = Depends(require_super)):
    if payload.role not in ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    username = payload.username.strip().lower()
    email = payload.email.strip().lower()
    if await db.admin_users.find_one({"$or": [{"username": username}, {"email": email}]}):
        raise HTTPException(status_code=409, detail="Username or email already exists")
    doc = {
        "_id": new_id(), "username": username, "email": email, "name": payload.name.strip(),
        "password_hash": hash_password(payload.password), "role": payload.role,
        "active": True, "created_at": now_iso(),
    }
    await db.admin_users.insert_one(doc)
    await log_audit(admin, "create", "admin_user", doc["_id"], f"Created admin user {username}")
    doc.pop("password_hash")
    return serialize(doc)


@auth_router.patch("/users/{user_id}")
async def update_user(user_id: str, payload: AdminUserUpdate, admin: dict = Depends(require_super)):
    user = await db.admin_users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates: dict = {}
    if payload.name:
        updates["name"] = payload.name.strip()
    if payload.role:
        if payload.role not in ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        updates["role"] = payload.role
    if payload.active is not None:
        if user["_id"] == admin["id"] and payload.active is False:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
        updates["active"] = payload.active
    if payload.password:
        if len(payload.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        updates["password_hash"] = hash_password(payload.password)
    if not updates:
        raise HTTPException(status_code=400, detail="No permitted fields to update")
    await db.admin_users.update_one({"_id": user_id}, {"$set": updates})
    await log_audit(admin, "update", "admin_user", user_id, f"Updated fields: {', '.join(updates.keys())}")
    updated = await db.admin_users.find_one({"_id": user_id}, {"password_hash": 0})
    return serialize(updated)


async def seed_admin():
    username = os.environ["ADMIN_USERNAME"].strip().lower()
    email = os.environ["ADMIN_EMAIL"].strip().lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.admin_users.find_one({"username": username})
    if existing is None:
        await db.admin_users.insert_one({
            "_id": new_id(), "username": username, "email": email, "name": "Super Admin",
            "password_hash": hash_password(password), "role": "super_admin",
            "active": True, "created_at": now_iso(),
        })
    elif not verify_password(password, existing["password_hash"]):
        await db.admin_users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"password_hash": hash_password(password), "role": "super_admin", "active": True}},
        )
