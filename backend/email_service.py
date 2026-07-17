"""All automated system email (welcome emails, certificates/letters,
invoices, password resets, and any future automated communication) is sent
from team@thefinancialdoctor.in — a dedicated mailbox for system-generated
mail, kept separate from the CEO's own inbox.

Primary transport is Resend's HTTPS API (RESEND_API_KEY) — it sends over
port 443 like normal web traffic, so it works on hosts that block outbound
SMTP ports entirely (Render does, silently — connections to 465/587 hang
until they time out rather than being refused). Falls back to direct SMTP
via Hostinger (SMTP_USERNAME/SMTP_PASSWORD) when RESEND_API_KEY isn't set,
which keeps local development working without requiring a Resend account.
"""
import base64
import logging
import os
import smtplib
import socket
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "Team - The Financial Doctor <team@thefinancialdoctor.in>")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "team@thefinancialdoctor.in")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")


class _IPv4SMTP_SSL(smtplib.SMTP_SSL):
    """Some hosts (Render's outbound network, notably) can't route IPv6, but
    Python's default connection logic still picks an IPv6 (AAAA) address for
    the SMTP host when the DNS record has one available, which fails with
    "[Errno 101] Network is unreachable" even though IPv4 connectivity works
    fine. socket.gethostbyname() only ever does an A-record (IPv4) lookup,
    so resolving through it and connecting to that address sidesteps the
    IPv6 auto-selection entirely. TLS verification is unaffected — the
    certificate is still checked against the real hostname via
    server_hostname, only the underlying TCP connection target changes."""
    def _get_socket(self, host, port, timeout):
        ipv4_addr = socket.gethostbyname(host)
        new_socket = socket.create_connection((ipv4_addr, port), timeout, self.source_address)
        return self.context.wrap_socket(new_socket, server_hostname=self._host)

TFD_LOGO_URL = "https://thefinancialdoctor.in/assets/logos/TFD-MAIN-LOGO.png"
WORKSPACE_LOGO_URL = "https://thefinancialdoctor.in/tfd-workspace-logo.png"
LOGIN_URL = "https://thefinancialdoctor.in/portal/login"
RESET_PASSWORD_URL = "https://thefinancialdoctor.in/portal/reset-password"
ANDROID_APK_URL = "https://thefinancialdoctor.in/TFD-Workspace.apk"

# TFD Internship (gamified program) — its own login, separate from TFD
# Workspace above, so its emails get their own URLs/branding.
INTERNSHIP_LOGO_URL = "https://thefinancialdoctor.in/assets/logos/TFD-INTERNSHIP-LOGO.png"
INTERNSHIP_LOGIN_URL = "https://thefinancialdoctor.in/internship/login"
INTERNSHIP_RESET_PASSWORD_URL = "https://thefinancialdoctor.in/internship/reset-password"


def email_configured() -> bool:
    return bool(RESEND_API_KEY) or bool(SMTP_PASSWORD and SMTP_USERNAME)


def _send_via_resend(to_email: str, subject: str, html: str, attachments: list[tuple[str, bytes]] | None = None, cc_emails: list[str] | None = None) -> tuple[bool, str]:
    payload = {"from": RESEND_FROM, "to": [to_email], "subject": subject, "html": html}
    if cc_emails:
        payload["cc"] = cc_emails
    if attachments:
        payload["attachments"] = [
            {"filename": filename, "content": base64.b64encode(content).decode("ascii")}
            for filename, content in attachments
        ]
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json=payload, timeout=20,
        )
        if resp.is_success:
            return True, "sent"
        return False, f"Resend API error {resp.status_code}: {resp.text[:300]}"
    except Exception as exc:
        logger.exception("Resend send failed for %s", to_email)
        return False, str(exc)


def _send_via_smtp(to_email: str, subject: str, html: str, attachments: list[tuple[str, bytes]] | None = None, cc_emails: list[str] | None = None) -> tuple[bool, str]:
    cc_emails = cc_emails or []
    msg = MIMEMultipart("mixed") if attachments else MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Team - The Financial Doctor <{SMTP_USERNAME}>"
    msg["To"] = to_email
    if cc_emails:
        msg["Cc"] = ", ".join(cc_emails)
    msg.attach(MIMEText(html, "html"))
    for filename, content in (attachments or []):
        attachment = MIMEApplication(content, _subtype="pdf")
        attachment.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(attachment)

    try:
        with _IPv4SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, [to_email] + cc_emails, msg.as_string())
        return True, "sent"
    except Exception as exc:
        logger.exception("SMTP send failed for %s", to_email)
        return False, str(exc)


def _send_email(to_email: str, subject: str, html: str, attachments: list[tuple[str, bytes]] | None = None, cc_emails: list[str] | None = None) -> tuple[bool, str]:
    """Single entry point every send function below goes through — Resend
    first when configured, SMTP otherwise. See module docstring for why."""
    if RESEND_API_KEY:
        return _send_via_resend(to_email, subject, html, attachments, cc_emails)
    if SMTP_USERNAME and SMTP_PASSWORD:
        return _send_via_smtp(to_email, subject, html, attachments, cc_emails)
    return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"


def _welcome_html(name: str, phone: str, password: str) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:540px;margin:0 auto;background:#F5F1EB;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{TFD_LOGO_URL}" alt="The Financial Doctor" style="height:56px;object-fit:contain;background:#fff;border-radius:8px;padding:6px;" />
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E2D8C2;">
        <h2 style="color:#0E1B2C;margin:0 0 4px;font-size:21px;">Welcome to TFD Workspace, {name}! 🎉</h2>
        <p style="color:#5C677D;font-size:13.5px;line-height:1.6;margin:10px 0 22px;">
          We're delighted to have you on board at <strong>The Financial Doctor</strong>. Your employee account has
          been created on <strong>TFD Workspace</strong> — our staff portal for attendance, leads, targets, salary,
          and everything else you'll need as part of the team. Please find your login credentials below.
        </p>

        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:22px;">
          <tr>
            <td style="background:#FBF7EE;border:1px solid #E2D8C2;border-radius:10px 0 0 10px;padding:14px 16px;width:50%;">
              <p style="margin:0 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:#8A93A6;font-weight:600;">User ID</p>
              <p style="margin:0;font-size:15px;font-family:'Courier New',monospace;color:#0E1B2C;font-weight:700;">{phone}</p>
            </td>
            <td style="width:6px;"></td>
            <td style="background:#FBF7EE;border:1px solid #E2D8C2;border-radius:0 10px 10px 0;padding:14px 16px;width:50%;">
              <p style="margin:0 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:#8A93A6;font-weight:600;">Password</p>
              <p style="margin:0;font-size:15px;font-family:'Courier New',monospace;color:#024396;font-weight:700;">{password}</p>
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="{LOGIN_URL}" style="display:inline-block;background:#024396;color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:600;font-size:14.5px;">Log In to TFD Workspace →</a>
        </div>

        <hr style="border:none;border-top:1px solid #E2D8C2;margin:4px 0 20px;" />

        <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#8A93A6;font-weight:600;margin:0 0 12px;">Install TFD Workspace on your phone</p>

        <div style="background:#F5F1EB;border-radius:10px;padding:14px 16px;margin-bottom:10px;">
          <p style="font-size:13px;color:#2A364B;margin:0;line-height:1.55;">
            <strong>🤖 Android users:</strong> <a href="{ANDROID_APK_URL}" style="color:#024396;font-weight:600;">Tap here to download the TFD Workspace app</a>
            and install it directly on your device.
          </p>
        </div>
        <div style="background:#F5F1EB;border-radius:10px;padding:14px 16px;">
          <p style="font-size:13px;color:#2A364B;margin:0;line-height:1.55;">
            <strong>📱 iPhone / iOS users:</strong> Open the "Log In to TFD Workspace" link above in Safari, tap the
            Share icon, then choose <strong>"Add to Home Screen."</strong> TFD Workspace will install automatically
            like a regular app, right on your home screen.
          </p>
        </div>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <img src="{WORKSPACE_LOGO_URL}" alt="TFD Workspace" style="height:32px;object-fit:contain;" />
        <p style="font-size:10.5px;color:#9AA5B4;margin-top:8px;">The Financial Doctor &middot; TFD Workspace &middot; thefinancialdoctor.in</p>
      </div>
    </div>
    """


def send_welcome_email(to_email: str, name: str, phone: str, password: str) -> tuple[bool, str]:
    """Returns (success, message)."""
    if not email_configured():
        return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"
    return _send_email(to_email, "Welcome to TFD Workspace — Your Login Details", _welcome_html(name, phone, password))


def _password_reset_html(name: str, reset_url: str) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F5F1EB;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{TFD_LOGO_URL}" alt="The Financial Doctor" style="height:56px;object-fit:contain;background:#fff;border-radius:8px;padding:6px;" />
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E2D8C2;">
        <h2 style="color:#0E1B2C;margin:0 0 4px;font-size:20px;">Reset your password</h2>
        <p style="color:#5C677D;font-size:13px;margin:12px 0;">
          Hi {name}, we received a request to reset your TFD Workspace password. Click the button below to choose a
          new one.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="{reset_url}" style="display:inline-block;background:#024396;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">Reset Password →</a>
        </div>
        <p style="color:#5C677D;font-size:12.5px;margin:0;">
          This link expires in <strong>20 minutes</strong>, or as soon as it's used once — whichever comes first.
          If you didn't request this, you can safely ignore this email; your password won't change.
        </p>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <p style="font-size:11px;color:#9AA5B4;">The Financial Doctor &middot; TFD Workspace &middot; thefinancialdoctor.in</p>
      </div>
    </div>
    """


def send_password_reset_email(to_email: str, name: str, reset_url: str) -> tuple[bool, str]:
    if not email_configured():
        return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"
    return _send_email(to_email, "Reset your TFD Workspace password", _password_reset_html(name, reset_url))


def _internship_welcome_html(name: str, intern_id: str, track_label: str, duration_days: int, payment_amount: int) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:540px;margin:0 auto;background:#050B16;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{INTERNSHIP_LOGO_URL}" alt="TFD Internship" style="height:48px;object-fit:contain;" />
      </div>
      <div style="background:#0E1B2C;border-radius:16px;padding:28px;border:1px solid #1F2E44;">
        <h2 style="color:#F6F1E8;margin:0 0 4px;font-size:21px;">Welcome to TFD Internship, {name}! 🎓</h2>
        <p style="color:#9AA5B4;font-size:13.5px;line-height:1.6;margin:10px 0 22px;">
          Thanks for applying to <strong style="color:#F6F1E8;">The Financial Doctor's</strong> internship program. Your
          seat in the <strong style="color:#14E0A0;">{track_label}</strong> track ({duration_days} days) is reserved —
          Day 1 begins automatically the moment your payment of &#8377;{payment_amount} is confirmed.
        </p>

        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:22px;">
          <tr>
            <td style="background:#050B16;border:1px solid #1F2E44;border-radius:10px;padding:14px 16px;">
              <p style="margin:0 0 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;font-weight:600;">Your Intern ID</p>
              <p style="margin:0;font-size:15px;font-family:'Courier New',monospace;color:#14E0A0;font-weight:700;">{intern_id}</p>
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin-bottom:8px;">
          <a href="{INTERNSHIP_LOGIN_URL}" style="display:inline-block;background:#14E0A0;color:#050B16;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14.5px;">Log In to TFD Internship →</a>
        </div>
        <p style="color:#6B7280;font-size:11.5px;text-align:center;margin:8px 0 0;">Log in anytime with the mobile number and password you signed up with.</p>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <p style="font-size:10.5px;color:#6B7280;">The Financial Doctor &middot; TFD Internship &middot; thefinancialdoctor.in</p>
      </div>
    </div>
    """


def send_internship_welcome_email(to_email: str, name: str, intern_id: str, track_label: str, duration_days: int, payment_amount: int) -> tuple[bool, str]:
    if not email_configured():
        return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"
    return _send_email(
        to_email, "Welcome to TFD Internship! 🎓",
        _internship_welcome_html(name, intern_id, track_label, duration_days, payment_amount),
    )


def _internship_password_reset_html(name: str, reset_url: str) -> str:
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#050B16;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{INTERNSHIP_LOGO_URL}" alt="TFD Internship" style="height:44px;object-fit:contain;" />
      </div>
      <div style="background:#0E1B2C;border-radius:16px;padding:28px;border:1px solid #1F2E44;">
        <h2 style="color:#F6F1E8;margin:0 0 4px;font-size:20px;">Reset your password</h2>
        <p style="color:#9AA5B4;font-size:13px;margin:12px 0;">
          Hi {name}, we received a request to reset your TFD Internship password. Click the button below to choose a
          new one.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="{reset_url}" style="display:inline-block;background:#14E0A0;color:#050B16;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">Reset Password →</a>
        </div>
        <p style="color:#6B7280;font-size:12.5px;margin:0;">
          This link expires in <strong>20 minutes</strong>, or as soon as it's used once — whichever comes first.
          If you didn't request this, you can safely ignore this email; your password won't change.
        </p>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <p style="font-size:10.5px;color:#6B7280;">The Financial Doctor &middot; TFD Internship &middot; thefinancialdoctor.in</p>
      </div>
    </div>
    """


def send_internship_password_reset_email(to_email: str, name: str, reset_url: str) -> tuple[bool, str]:
    if not email_configured():
        return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"
    return _send_email(to_email, "Reset your TFD Internship password", _internship_password_reset_html(name, reset_url))


def send_email_with_pdf(to_email: str, subject: str, body_html: str, pdf_bytes: bytes, pdf_filename: str) -> tuple[bool, str]:
    """Generic single-attachment sender — kept for existing callers; new
    code should prefer send_email_with_pdfs (plural) which this now wraps."""
    return send_email_with_pdfs(to_email, subject, body_html, [(pdf_filename, pdf_bytes)])


def send_email_with_pdfs(to_email: str, subject: str, body_html: str, attachments: list[tuple[str, bytes]], cc_emails: list[str] | None = None) -> tuple[bool, str]:
    """attachments: [(filename, pdf_bytes), ...] — used for bundled sends
    (e.g. a certificate emailed together with its completion letter).
    cc_emails: optional addresses to CC."""
    if not email_configured():
        return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"
    cc_emails = [e.strip() for e in (cc_emails or []) if e and e.strip()]
    return _send_email(to_email, subject, body_html, attachments=attachments, cc_emails=cc_emails)


def _branded_wrapper(heading: str, body_paragraphs: list[str]) -> str:
    paras = "".join(f"<p style='color:#5C677D;font-size:13px;margin:0 0 14px;'>{p}</p>" for p in body_paragraphs)
    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#F5F1EB;padding:24px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="{TFD_LOGO_URL}" alt="The Financial Doctor" style="height:56px;object-fit:contain;background:#fff;border-radius:8px;padding:6px;" />
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #E2D8C2;">
        <h2 style="color:#0E1B2C;margin:0 0 4px;font-size:20px;">{heading}</h2>
        {paras}
        <p style="color:#2A364B;font-size:13px;margin:16px 0 0;">Warm regards,<br/><strong>Team - The Financial Doctor</strong></p>
      </div>
      <div style="text-align:center;margin-top:18px;">
        <p style="font-size:11px;color:#9AA5B4;">The Financial Doctor &middot; AMFI Registered &middot; ARN-290298</p>
        <p style="font-size:10.5px;color:#9AA5B4;">thefinancialdoctor.in</p>
      </div>
    </div>
    """


def certificate_completion_email_html(intern_name: str, department: str, certificate_number: str = None, verify_url: str = None) -> str:
    """Sent when an internship Certificate (+ auto-bundled Completion
    Letter) goes out to a completed intern."""
    paragraphs = [
        "Congratulations on successfully completing your internship with The Financial Doctor! "
        f"Please find attached your Internship Certificate and Completion Letter, recognising your contribution "
        f"during your time with us in the {department} department.",
        "We truly appreciated your dedication and hard work, and we wish you the very best in your future endeavours. "
        "Feel free to reach out to us anytime — we'd love to stay in touch.",
    ]
    if certificate_number and verify_url:
        paragraphs.append(
            f"<strong>Verifying your certificate:</strong> Your certificate number is "
            f"<strong>{certificate_number}</strong>. You (or anyone else, such as a prospective employer) can verify "
            f"the authenticity of your certificate at any time by visiting our public verification page — "
            f"<a href='{verify_url}' style='color:#0E1B2C;'>{verify_url}</a> — and entering this certificate number. "
            "This verification link is also available on our website. Should your certificate or completion letter "
            "ever be lost or misplaced, you'll be able to request it again through the same public verification page."
        )
    return _branded_wrapper(f"Dear {intern_name},", paragraphs)


def offer_letter_email_html(intern_name: str) -> str:
    """Sent when an internship Offer Letter goes out on its own."""
    return _branded_wrapper(
        f"Dear {intern_name},",
        [
            "We are delighted to share your internship offer letter with The Financial Doctor, attached to this email. "
            "Please review the details and confirm your acceptance at your earliest convenience.",
            "We look forward to having you join our team!",
        ],
    )


def career_application_email_html(name: str, position: str = None) -> str:
    """Sent to an applicant right after they submit the public Career form."""
    role_text = f" for the <strong>{position}</strong> position" if position else ""
    paragraphs = [
        f"Thank you for applying{role_text} at The Financial Doctor! We've received your application and our HR "
        "team will carefully review your profile and credentials.",
        "If your profile matches what we're looking for, we'll reach out to you shortly via email or phone for "
        "the next steps. We appreciate your interest in joining our team.",
    ]
    return _branded_wrapper(f"Dear {name},", paragraphs)


def send_career_application_received_email(to_email: str, name: str, position: str = None) -> tuple[bool, str]:
    if not email_configured():
        return False, "Email sending not configured — set RESEND_API_KEY (recommended) or SMTP_USERNAME/SMTP_PASSWORD in backend/.env"
    return _send_email(to_email, "We've received your application — The Financial Doctor", career_application_email_html(name, position))


def document_email_html(person_name: str, document_labels: list[str], include_arn: bool = True) -> str:
    """Professional branded template for certificate/letter document sends —
    same visual language as the welcome email. include_arn=False is used by
    the TFD Internship program's emails (a distinct product from Sagar's
    AMFI mutual-fund distribution business), so the ARN line is omitted
    there while staying intact for employee/letterhead sends."""
    docs_list = "".join(f"<li style='margin-bottom:4px;'>{label}</li>" for label in document_labels)
    footer_line = (
        '<p style="font-size:11px;color:#9AA5B4;">The Financial Doctor &middot; AMFI Registered &middot; ARN-290298</p>'
        if include_arn else ""
    )
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
        {footer_line}
        <p style="font-size:10.5px;color:#9AA5B4;">thefinancialdoctor.in</p>
      </div>
    </div>
    """
