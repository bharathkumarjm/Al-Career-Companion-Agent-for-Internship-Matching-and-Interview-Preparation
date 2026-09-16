import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx


def get_active_email_provider() -> dict:
    """
    Returns the currently active configured email provider and setup state.
    """
    if os.getenv("RESEND_API_KEY"):
        return {"configured": True, "provider": "Resend API", "type": "HTTP API"}
    if os.getenv("SENDGRID_API_KEY"):
        return {"configured": True, "provider": "SendGrid API", "type": "HTTP API"}
    if os.getenv("BREVO_API_KEY"):
        return {"configured": True, "provider": "Brevo API", "type": "HTTP API"}
    if (os.getenv("GMAIL_SMTP_USER") or os.getenv("SMTP_USER")) and (os.getenv("GMAIL_SMTP_APP_PASSWORD") or os.getenv("SMTP_PASSWORD")):
        return {"configured": True, "provider": "Gmail SMTP", "type": "SMTP"}
    if os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"):
        return {"configured": True, "provider": "Generic SMTP", "type": "SMTP"}
    return {"configured": False, "provider": "Offline / Simulated", "type": "None"}


def _build_reset_email_html(to_email: str, reset_link: str, recipient_name: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TalentSprint AI - Password Reset Link</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .email-container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05); }}
    .email-header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px; color: #ffffff; }}
    .header-brand {{ font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; }}
    .header-sub {{ font-size: 13px; opacity: 0.9; margin-top: 4px; }}
    .email-body {{ padding: 32px; }}
    .greeting {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }}
    .body-text {{ font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 18px; }}
    .cta-container {{ text-align: center; margin: 28px 0; }}
    .btn-reset {{ display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }}
    .security-box {{ background: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 14px 16px; margin: 24px 0; font-size: 13px; color: #334155; line-height: 1.5; }}
    .link-fallback {{ font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }}
    .link-fallback a {{ color: #4f46e5; text-decoration: underline; }}
    .email-footer {{ background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="header-brand">⚡ TalentSprint AI</div>
      <div class="header-sub">Career & Internship Acceleration Platform</div>
    </div>

    <div class="email-body">
      <h2 class="greeting">Password Reset Request</h2>
      <p class="body-text">
        Hello <strong>{recipient_name}</strong>,
      </p>
      <p class="body-text">
        A password reset request was initiated for your registered Gmail account: <strong>{to_email}</strong>.
      </p>
      <p class="body-text">
        Click the secure button below to set a new password. This link is single-use and will expire in <strong>30 minutes</strong>.
      </p>

      <div class="cta-container">
        <a href="{reset_link}" class="btn-reset" target="_blank">Reset Account Password →</a>
      </div>

      <div class="security-box">
        <strong>🔒 Security Criteria Reminder:</strong><br>
        Your new password must satisfy all enterprise criteria: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and no whitespace.
      </div>

      <div class="link-fallback">
        If the button above does not open, copy and paste this link into your browser:<br>
        <a href="{reset_link}">{reset_link}</a>
      </div>
    </div>

    <div class="email-footer">
      If you did not request this password reset, your account remains secure. You can safely ignore this email.<br><br>
      © 2026 TalentSprint AI. All rights reserved.
    </div>
  </div>
</body>
</html>"""


def _send_via_resend(api_key: str, to_email: str, subject: str, html_body: str) -> dict:
    """Dispatches email via Resend REST API (https://resend.com)."""
    from_email = os.getenv("RESEND_FROM_EMAIL") or "TalentSprint AI <onboarding@resend.dev>"
    resp = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        },
        timeout=12.0,
    )
    if resp.status_code in (200, 201):
        data = resp.json()
        return {
            "sent_live": True,
            "provider": "Resend API",
            "message_id": data.get("id"),
            "message": f"Successfully delivered via Resend API to {to_email}"
        }
    else:
        err_msg = resp.text
        raise RuntimeError(f"Resend API error ({resp.status_code}): {err_msg}")


def _send_via_sendgrid(api_key: str, to_email: str, subject: str, html_body: str) -> dict:
    """Dispatches email via SendGrid REST API."""
    from_email = os.getenv("SENDGRID_FROM_EMAIL") or "security@talentsprint.ai"
    resp = httpx.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json",
        },
        json={
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email, "name": "TalentSprint AI Security"},
            "subject": subject,
            "content": [{"type": "text/html", "value": html_body}],
        },
        timeout=12.0,
    )
    if resp.status_code in (200, 202):
        return {
            "sent_live": True,
            "provider": "SendGrid API",
            "message": f"Successfully delivered via SendGrid to {to_email}"
        }
    else:
        raise RuntimeError(f"SendGrid error ({resp.status_code}): {resp.text}")


def _send_via_brevo(api_key: str, to_email: str, subject: str, html_body: str, recipient_name: str) -> dict:
    """Dispatches email via Brevo (Sendinblue) REST API."""
    from_email = os.getenv("BREVO_FROM_EMAIL") or "security@talentsprint.ai"
    resp = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": api_key.strip(),
            "Content-Type": "application/json",
            "accept": "application/json",
        },
        json={
            "sender": {"name": "TalentSprint AI Security", "email": from_email},
            "to": [{"email": to_email, "name": recipient_name}],
            "subject": subject,
            "htmlContent": html_body,
        },
        timeout=12.0,
    )
    if resp.status_code in (200, 201):
        return {
            "sent_live": True,
            "provider": "Brevo API",
            "message": f"Successfully delivered via Brevo API to {to_email}"
        }
    else:
        raise RuntimeError(f"Brevo error ({resp.status_code}): {resp.text}")


def _send_via_gmail_smtp(smtp_user: str, smtp_password: str, to_email: str, subject: str, html_body: str) -> dict:
    """Dispatches email via Google SMTP (smtp.gmail.com:587)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"TalentSprint AI Security <{smtp_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    server = smtplib.SMTP("smtp.gmail.com", 587, timeout=12)
    server.starttls()
    server.login(smtp_user.strip(), smtp_password.strip())
    server.sendmail(smtp_user.strip(), [to_email], msg.as_string())
    server.quit()

    return {
        "sent_live": True,
        "provider": "Gmail SMTP",
        "message": f"Successfully dispatched via Gmail SMTP to {to_email}"
    }


def _send_via_generic_smtp(to_email: str, subject: str, html_body: str) -> dict:
    """Dispatches email via Generic custom SMTP host."""
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", 587))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"TalentSprint AI Security <{user or 'security@talentsprint.ai'}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    server = smtplib.SMTP(host, port, timeout=12)
    if use_tls:
        server.starttls()
    if user and password:
        server.login(user.strip(), password.strip())
    server.sendmail(user or "security@talentsprint.ai", [to_email], msg.as_string())
    server.quit()

    return {
        "sent_live": True,
        "provider": f"SMTP ({host})",
        "message": f"Successfully dispatched via SMTP ({host}) to {to_email}"
    }


def send_password_reset_email(to_email: str, reset_link: str, recipient_name: str = "Student") -> dict:
    """
    Sends a high-security password reset email to the registered Gmail account.
    Prioritizes real transactional email services:
    1. Resend API (RESEND_API_KEY)
    2. SendGrid API (SENDGRID_API_KEY)
    3. Brevo API (BREVO_API_KEY)
    4. Google Gmail SMTP (GMAIL_SMTP_USER & GMAIL_SMTP_APP_PASSWORD)
    5. Custom SMTP (SMTP_HOST, SMTP_PORT, etc.)
    Falls back gracefully if no credentials are configured yet.
    """
    subject = "TalentSprint AI - Secure Password Reset Link"
    html_body = _build_reset_email_html(to_email, reset_link, recipient_name)

    # 1. Resend API
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        try:
            return _send_via_resend(resend_key, to_email, subject, html_body)
        except Exception as e:
            print(f"[RESEND WARNING] Delivery failed: {e}")

    # 2. SendGrid API
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    if sendgrid_key:
        try:
            return _send_via_sendgrid(sendgrid_key, to_email, subject, html_body)
        except Exception as e:
            print(f"[SENDGRID WARNING] Delivery failed: {e}")

    # 3. Brevo API
    brevo_key = os.getenv("BREVO_API_KEY")
    if brevo_key:
        try:
            return _send_via_brevo(brevo_key, to_email, subject, html_body, recipient_name)
        except Exception as e:
            print(f"[BREVO WARNING] Delivery failed: {e}")

    # 4. Gmail SMTP
    gmail_user = os.getenv("GMAIL_SMTP_USER") or os.getenv("SMTP_USER")
    gmail_pass = os.getenv("GMAIL_SMTP_APP_PASSWORD") or os.getenv("SMTP_PASSWORD")
    if gmail_user and gmail_pass and "gmail.com" in gmail_user:
        try:
            return _send_via_gmail_smtp(gmail_user, gmail_pass, to_email, subject, html_body)
        except Exception as e:
            print(f"[GMAIL SMTP WARNING] Delivery failed: {e}")

    # 5. Generic SMTP
    if os.getenv("SMTP_HOST"):
        try:
            return _send_via_generic_smtp(to_email, subject, html_body)
        except Exception as e:
            print(f"[GENERIC SMTP WARNING] Delivery failed: {e}")

    # Fallback: No credentials configured in .env yet
    return {
        "sent_live": False,
        "provider": "Offline / Simulated",
        "recipient": to_email,
        "message": f"Password reset link generated for registered Gmail account: {to_email}. Add RESEND_API_KEY or GMAIL_SMTP_APP_PASSWORD in .env for live internet delivery."
    }
