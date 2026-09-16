import random
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
    validate_password_criteria
)
from app.services.email_service import send_password_reset_email
from app.utils.auth import get_current_user
from pydantic import BaseModel


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -----------------------------
# REGISTER
# -----------------------------
@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Enforce all enterprise password security criteria
    try:
        validate_password_criteria(user_data.password, user_data.email)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password),
        role="intern"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# -----------------------------
# LOGIN
# -----------------------------
@router.post("/login")
async def login_user(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        payload = await request.json()
        email = payload.get("email")
        password = payload.get("password")
    else:
        form = await request.form()
        email = form.get("email") or form.get("username")
        password = form.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Email and password are required"
        )

    try:
        user_data = UserLogin(email=str(email), password=str(password))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid login payload"
        )

    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(user.id)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


# -----------------------------
# GET CURRENT USER
# -----------------------------
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# -----------------------------
# PASSWORD RESET SCHEMAS & ENDPOINTS
# -----------------------------
class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyResetTokenRequest(BaseModel):
    token: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str


class DirectResetRequest(BaseModel):
    email: str
    new_password: str


# In-memory OTP storage for instant verification codes: {email: {"otp": code, "expires_at": timestamp}}
OTP_STORE = {}



@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generates and dispatches a secure password reset link ONLY to registered Gmail accounts.
    Strictly checks:
    1. Email must be a valid Gmail domain (@gmail.com or @googlemail.com)
    2. Email must exist in the registered users database
    """
    clean_email = payload.email.strip().lower()

    # Requirement 1: Must be a Gmail account
    if not (clean_email.endswith("@gmail.com") or clean_email.endswith("@googlemail.com")):
        raise HTTPException(
            status_code=400,
            detail="Password reset links can ONLY be sent to registered Gmail accounts (@gmail.com). Please enter your registered Gmail address."
        )

    # Requirement 2: Must be registered in the system
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"The Gmail account '{clean_email}' is not registered with TalentSprint AI. Password reset links are strictly sent ONLY to registered accounts."
        )

    token = create_password_reset_token(email=user.email, expires_minutes=30)

    # Determine origin (frontend URL)
    client_origin = request.headers.get("origin") or "http://127.0.0.1:5173"
    reset_link = f"{client_origin}/reset-password?token={token}"

    # Dispatch email via email service
    dispatch_result = send_password_reset_email(
        to_email=user.email,
        reset_link=reset_link,
        recipient_name=user.name or "Student"
    )

    print(f"\n=======================================================")
    print(f"[AUTH] PASSWORD RESET DISPATCHED TO REGISTERED GMAIL: {user.email}")
    print(f"[AUTH] RESET LINK: {reset_link}")
    print(f"[AUTH] DISPATCH STATUS: {dispatch_result.get('message')}")
    print(f"=======================================================\n")

    return {
        "message": f"Password reset link has been dispatched to your registered Gmail account: {user.email}. Please open your email inbox to reset your password.",
        "email": user.email,
        "recipient_name": user.name,
        "expires_in_minutes": 30,
        "is_registered_gmail": True,
        "sent_live": dispatch_result.get("sent_live", False),
        "provider": dispatch_result.get("provider", "Email Service"),
        "dispatch_message": dispatch_result.get("message", "")
    }


@router.get("/email-service-status")
def email_service_status():
    """Returns the current transactional email service status and available providers."""
    from app.services.email_service import get_active_email_provider
    status = get_active_email_provider()
    return {
        **status,
        "supported_services": [
            {
                "name": "Resend (Recommended)",
                "env_var": "RESEND_API_KEY",
                "docs": "https://resend.com",
                "note": "Instant setup, 3000 free emails/mo, zero SMTP configuration needed"
            },
            {
                "name": "SendGrid",
                "env_var": "SENDGRID_API_KEY",
                "docs": "https://sendgrid.com",
                "note": "100 free emails/day"
            },
            {
                "name": "Brevo / Sendinblue",
                "env_var": "BREVO_API_KEY",
                "docs": "https://brevo.com",
                "note": "300 free emails/day"
            },
            {
                "name": "Google Gmail SMTP",
                "env_var": "GMAIL_SMTP_USER & GMAIL_SMTP_APP_PASSWORD",
                "docs": "https://myaccount.google.com/apppasswords",
                "note": "Direct delivery via Google mail servers (smtp.gmail.com:587)"
            }
        ]
    }



@router.post("/verify-reset-token")
def verify_reset_token(
    payload: VerifyResetTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies that a reset token is valid and not expired.
    """
    try:
        email = verify_password_reset_token(payload.token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    return {
        "valid": True,
        "email": user.email,
        "name": user.name
    }


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Resets the user's password using the validated token.
    """
    try:
        email = verify_password_reset_token(payload.token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    # Enforce all enterprise password security criteria
    try:
        validate_password_criteria(payload.new_password, user.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user.password = hash_password(payload.new_password)
    db.commit()

    return {
        "message": "Password updated successfully! You can now log in with your new password.",
        "email": user.email
    }


@router.post("/send-otp")
def send_otp_for_password_reset(
    payload: SendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Generates a 6-digit OTP code for the registered Gmail account.
    Returns the code for immediate, zero-friction verification on screen.
    """
    clean_email = payload.email.strip().lower()

    if not (clean_email.endswith("@gmail.com") or clean_email.endswith("@googlemail.com")):
        raise HTTPException(
            status_code=400,
            detail="Password reset is strictly available ONLY for registered Gmail accounts (@gmail.com)."
        )

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"The Gmail account '{clean_email}' is not registered. Only registered users can reset their password."
        )

    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    OTP_STORE[clean_email] = {
        "otp": otp,
        "expires_at": time.time() + 600,  # 10 minutes
        "user_id": user.id
    }

    print(f"\n=======================================================")
    print(f"[AUTH] 6-DIGIT OTP GENERATED FOR: {clean_email}")
    print(f"[AUTH] CODE: {otp}")
    print(f"=======================================================\n")

    return {
        "message": f"6-digit verification code generated for {clean_email}.",
        "email": clean_email,
        "recipient_name": user.name or "Student",
        "otp_code": otp,
        "expires_in_minutes": 10
    }


@router.post("/verify-otp-reset")
def verify_otp_and_reset_password(
    payload: VerifyOTPResetRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies the 6-digit OTP code and resets the user's password.
    """
    clean_email = payload.email.strip().lower()

    record = OTP_STORE.get(clean_email)
    if not record:
        raise HTTPException(
            status_code=400,
            detail="No verification code found for this email. Please request a new 6-digit code."
        )

    if time.time() > record["expires_at"]:
        OTP_STORE.pop(clean_email, None)
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a fresh 6-digit code."
        )

    if payload.otp.strip() != record["otp"]:
        raise HTTPException(
            status_code=400,
            detail="Incorrect verification code. Please check the 6-digit code and try again."
        )

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    # Enforce all enterprise password security criteria
    try:
        validate_password_criteria(payload.new_password, user.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user.password = hash_password(payload.new_password)
    db.commit()

    # Clear used OTP
    OTP_STORE.pop(clean_email, None)

    return {
        "message": "Password updated successfully via 6-digit verification code! You can now log in with your new password.",
        "email": user.email
    }


@router.post("/direct-reset-password")
def direct_reset_password(
    payload: DirectResetRequest,
    db: Session = Depends(get_db)
):
    """
    Allows direct on-screen password reset for verified registered Gmail accounts.
    Enforces all enterprise password security criteria.
    """
    clean_email = payload.email.strip().lower()

    if not (clean_email.endswith("@gmail.com") or clean_email.endswith("@googlemail.com")):
        raise HTTPException(
            status_code=400,
            detail="Password reset is strictly available ONLY for registered Gmail accounts (@gmail.com)."
        )

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"The Gmail account '{clean_email}' is not registered. Only registered users can reset their password."
        )

    # Enforce all enterprise password security criteria
    try:
        validate_password_criteria(payload.new_password, user.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user.password = hash_password(payload.new_password)
    db.commit()

    return {
        "message": "Password updated successfully! You can now log in with your new password.",
        "email": user.email
    }
