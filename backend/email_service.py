"""One-click welcome email for newly-created employees, sent via SMTP from
ceo@thefinancialdoctor.in. That mailbox is hosted on Hostinger, not Gmail —
plain SMTP_SSL with the mailbox's own password (no Google App Password/OAuth
involved).
"""
import logging
import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "ceo@thefinancialdoctor.in")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

TFD_LOGO_URL = "https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png"
WORKSPACE_LOGO_URL = "https://thefinancialdoctor.in/tfd-workspace-logo.png"
LOGIN_URL = "https://thefinancialdoctor.in/portal/login"
ANDROID_APK_URL = "https://thefinancialdoctor.in/TFD-Workspace.apk"


def email_configured() -> bool:
    return bool(SMTP_PASSWORD and SMTP_USERNAME)


def _welcome_html(name: str, phone: str, password: str) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F5F1EB;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{TFD_LOGO_URL}" alt="The Financial Doctor" style="height:56px;object-fit:contain;background:#fff;border-radius:8px;padding:6px;" />
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E2D8C2;">
        <h2 style="color:#0E1B2C;margin:0 0 4px;font-size:20px;">Welcome to TFD Workspace, {name}! 🎉</h2>
        <p style="color:#5C677D;font-size:13px;margin:0 0 20px;">Aapka employee account ban gaya hai. Neeche apni login details dekhein:</p>
        <div style="background:#FBF7EE;border:1px solid #E2D8C2;border-radius:10px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#2A364B;"><strong>User ID (Mobile):</strong> {phone}</p>
          <p style="margin:0;font-size:13px;color:#2A364B;"><strong>Password:</strong> <span style="font-family:monospace;color:#024396;font-weight:700;">{password}</span></p>
        </div>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="{LOGIN_URL}" style="display:inline-block;background:#024396;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">Login Now →</a>
        </div>
        <hr style="border:none;border-top:1px solid #E2D8C2;margin:20px 0;" />
        <p style="font-size:12.5px;color:#2A364B;margin:0 0 6px;"><strong>📱 iPhone/iOS users:</strong> Upar wale "Login Now" link ko Safari mein kholein, phir Share button → "Add to Home Screen" — TFD Workspace app ki tarah install ho jayega.</p>
        <p style="font-size:12.5px;color:#2A364B;margin:0;"><strong>🤖 Android users:</strong> App install karne ke liye <a href="{ANDROID_APK_URL}" style="color:#024396;">yahan click karein</a> aur APK download karein.</p>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <img src="{WORKSPACE_LOGO_URL}" alt="TFD Workspace" style="height:32px;object-fit:contain;" />
        <p style="font-size:10.5px;color:#9AA5B4;margin-top:8px;">The Financial Doctor · TFD Workspace · thefinancialdoctor.in</p>
      </div>
    </div>
    """


def send_welcome_email(to_email: str, name: str, phone: str, password: str) -> tuple[bool, str]:
    """Returns (success, message)."""
    if not email_configured():
        return False, "Email sending not configured — set SMTP_USERNAME and SMTP_PASSWORD in backend/.env"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to TFD Workspace — Your Login Details"
    msg["From"] = f"The Financial Doctor <{SMTP_USERNAME}>"
    msg["To"] = to_email
    msg.attach(MIMEText(_welcome_html(name, phone, password), "html"))

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, [to_email], msg.as_string())
        return True, "sent"
    except Exception as exc:
        logger.exception("Failed to send welcome email to %s", to_email)
        return False, str(exc)


def send_email_with_pdf(to_email: str, subject: str, body_html: str, pdf_bytes: bytes, pdf_filename: str) -> tuple[bool, str]:
    """Generic single-attachment sender — kept for existing callers; new
    code should prefer send_email_with_pdfs (plural) which this now wraps."""
    return send_email_with_pdfs(to_email, subject, body_html, [(pdf_filename, pdf_bytes)])


def send_email_with_pdfs(to_email: str, subject: str, body_html: str, attachments: list[tuple[str, bytes]]) -> tuple[bool, str]:
    """attachments: [(filename, pdf_bytes), ...] — used for bundled sends
    (e.g. a certificate emailed together with its completion letter)."""
    if not email_configured():
        return False, "Email sending not configured — set SMTP_USERNAME and SMTP_PASSWORD in backend/.env"

    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = f"The Financial Doctor <{SMTP_USERNAME}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))

    for filename, pdf_bytes in attachments:
        attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        attachment.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(attachment)

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, [to_email], msg.as_string())
        return True, "sent"
    except Exception as exc:
        logger.exception("Failed to send %s document(s) to %s", len(attachments), to_email)
        return False, str(exc)


def document_email_html(person_name: str, document_labels: list[str]) -> str:
    """Professional branded template for certificate/letter document sends —
    same visual language as the welcome email."""
    docs_list = "".join(f"<li style='margin-bottom:4px;'>{label}</li>" for label in document_labels)
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F5F1EB;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{TFD_LOGO_URL}" alt="The Financial Doctor" style="height:56px;object-fit:contain;background:#fff;border-radius:8px;padding:6px;" />
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E2D8C2;">
        <h2 style="color:#0E1B2C;margin:0 0 4px;font-size:20px;">Dear {person_name},</h2>
        <p style="color:#5C677D;font-size:13px;margin:12px 0;">
          Please find attached the following document{"s" if len(document_labels) > 1 else ""} from The Financial Doctor:
        </p>
        <ul style="color:#2A364B;font-size:13px;margin:0 0 20px;padding-left:20px;">
          {docs_list}
        </ul>
        <p style="color:#5C677D;font-size:13px;margin:0;">
          If you have any questions, feel free to reach out to us.
        </p>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <p style="font-size:11px;color:#9AA5B4;">The Financial Doctor &middot; AMFI Registered &middot; ARN-290298</p>
        <p style="font-size:10.5px;color:#9AA5B4;">thefinancialdoctor.in</p>
      </div>
    </div>
    """
