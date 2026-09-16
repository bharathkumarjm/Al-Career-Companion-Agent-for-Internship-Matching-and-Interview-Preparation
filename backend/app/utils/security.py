import re
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

from app.config import settings

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

import string
SPECIAL_CHARACTERS = set(string.punctuation)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(user_id: int):
    expire = datetime.utcnow() + timedelta(hours=2)

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )

    return token


def create_password_reset_token(email: str, expires_minutes: int = 30) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {
        "sub": email,
        "purpose": "password_reset",
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def verify_password_reset_token(token: str) -> str:
    """Verifies the reset token and returns the email if valid, or raises ValueError."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("purpose") != "password_reset":
            raise ValueError("Invalid token purpose")
        email: str = payload.get("sub")
        if not email:
            raise ValueError("Missing email in token")
        return email
    except Exception as e:
        raise ValueError(f"Invalid or expired token: {str(e)}")


def validate_password_criteria(password: str, email: str = None) -> None:
    """
    Validates all enterprise security criteria for a password:
    1. Minimum 8 characters, maximum 128 characters
    2. At least one uppercase letter (A-Z)
    3. At least one lowercase letter (a-z)
    4. At least one numeric digit (0-9)
    5. At least one special symbol (!@#$%^&*()_+-=[]{}|;:,.<>?~`"'/\)
    6. No spaces or whitespace allowed
    7. Cannot contain user email prefix (min 3 chars)
    Raises ValueError with an explicit descriptive error message if any criteria fail.
    """
    if not password:
        raise ValueError("Password is required.")

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")

    if len(password) > 128:
        raise ValueError("Password cannot exceed 128 characters.")

    if any(c.isspace() for c in password):
        raise ValueError("Password must not contain spaces or whitespace characters.")

    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter (A-Z).")

    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter (a-z).")

    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one numeric digit (0-9).")

    if not any(c in SPECIAL_CHARACTERS for c in password):
        raise ValueError("Password must contain at least one special character (e.g. !@#$%^&*).")

    if email:
        prefix = email.split("@")[0].lower()
        if len(prefix) >= 3 and prefix in password.lower():
            raise ValueError("Password cannot contain your email username.")
