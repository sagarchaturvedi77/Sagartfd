"""Internal endpoint that drives every scheduled/recurring notification
(punch-out reminders, morning motivation, follow-up digests, lead-inactivity
sweeps, the periodic website visitor broadcast, etc.).

Render's free plan has no standalone Background Worker, so this logic can't
run as an always-on process the way backend/scheduler_worker.py was
originally designed. Instead it lives here as a regular endpoint on the main
web service, and an external free cron (e.g. cron-job.org) hits it every
15-30 minutes. Each call is a cheap, idempotent "check what's due and run
it" pass — backend/scheduler_worker.py's run_due_checks() tracks per-job
last-run state in Mongo (scheduler_state collection) so calling this too
often, or missing a call, never double-sends or skips a day.

Protected by a shared-secret token (INTERNAL_CRON_SECRET env var) so a
random request can't trigger it — accepted via either the `X-Cron-Secret`
header or a `?token=` query param, since not every free cron service lets
you set custom headers.
"""
import hmac
import os

from fastapi import APIRouter, Header, HTTPException, Query
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/api/internal", tags=["internal"])

CRON_SECRET = os.environ.get("INTERNAL_CRON_SECRET", "")


def _check_secret(token_header: str | None, token_query: str | None) -> None:
    if not CRON_SECRET:
        # Not configured — refuse rather than silently running unprotected.
        raise HTTPException(status_code=503, detail="INTERNAL_CRON_SECRET not configured")
    supplied = token_header or token_query or ""
    if not hmac.compare_digest(supplied, CRON_SECRET):
        raise HTTPException(status_code=403, detail="Invalid or missing cron secret")


@router.post("/run-scheduled-tasks")
async def run_scheduled_tasks(
    x_cron_secret: str | None = Header(default=None),
    token: str | None = Query(default=None),
):
    _check_secret(x_cron_secret, token)

    # scheduler_worker.py uses a synchronous pymongo client (kept separate
    # from the app's async Motor client in database.py) — run it off the
    # event loop so a slow pass (many reminders/subscribers) can't stall
    # other requests.
    #
    # Deliberately a bare summary either way (job names + counts, never raw
    # reminder/lead/event documents) and any failure is caught and reported
    # as a short, truncated message rather than letting an exception's
    # traceback/repr — which could easily include a full Mongo document —
    # reach the response body. Free-tier cron services (e.g. cron-job.org)
    # cap response size, so this endpoint must never be able to return
    # anything but a small, fixed-shape JSON object.
    import scheduler_worker
    try:
        result = await run_in_threadpool(scheduler_worker.run_due_checks)
        ran = result.get("ran", [])
    except Exception as e:
        return {"status": "error", "error": str(e)[:200]}

    # Auto-graduation runs here (not in scheduler_worker.py) because it
    # needs internship_routes.py's own _graduation_eligibility /
    # _generate_graduation_documents — reusing those directly, on this
    # same async event loop, beats re-implementing certificate/PDF/R2
    # generation a second time against scheduler_worker.py's separate sync
    # pymongo client. Errors here are caught per-student so one student's
    # PDF/R2 failure can't stop everyone else's certificate from issuing.
    try:
        from internship_routes import _graduation_eligibility, _generate_graduation_documents
        from database import internship_students_collection
        from notification_service import create_notification

        graduated_count = 0
        error_count = 0
        async for student in internship_students_collection.find({"status": "active", "is_demo": {"$ne": True}}):
            try:
                check = await _graduation_eligibility(student)
                if check.eligible:
                    await _generate_graduation_documents(student, check, "auto-scheduler")
                    graduated_count += 1
                    await create_notification(
                        user_id=student["id"],
                        title="Your certificate is ready! 🎓",
                        body=f"You graduated with a {check.percentage}% score — your certificate is ready to download.",
                        n_type="internship_certificate",
                        link="/portal/student/certificate",
                    )
            except Exception:
                error_count += 1
        ran.append(f"internship_auto_graduate ({graduated_count} graduated, {error_count} errors)")
    except Exception as e:
        ran.append(f"internship_auto_graduate (failed: {str(e)[:150]})")

    # AI Manager: one daily check-in per active student (idempotent via
    # last_manager_checkin_date), plus the "manager is waiting for your
    # reply" follow-up for un-replied messages — see internship_manager_
    # routes.py's run_daily_manager_checkins docstring for the idempotency
    # details.
    try:
        from internship_manager_routes import run_daily_manager_checkins
        checkin_result = await run_daily_manager_checkins()
        ran.append(
            f"internship_manager_checkins ({checkin_result['checkins_sent']} sent, "
            f"{checkin_result['followups_sent']} follow-ups, {checkin_result['errors']} errors)"
        )
    except Exception as e:
        ran.append(f"internship_manager_checkins (failed: {str(e)[:150]})")

    # TFD Mailbox: deliver any simulated client auto-response whose delay
    # window has elapsed — see internship_mailbox_routes.py.
    try:
        from internship_mailbox_routes import process_pending_mailbox_responses
        mail_result = await process_pending_mailbox_responses()
        ran.append(f"internship_mailbox_responses ({mail_result['sent']} sent, {mail_result['errors']} errors)")
    except Exception as e:
        ran.append(f"internship_mailbox_responses (failed: {str(e)[:150]})")

    return {"status": "ok", "ran": ran, "checked_at": result.get("checked_at")}
