import os
import json
import logging

try:
    import firebase_admin
    from firebase_admin import credentials
except Exception:
    firebase_admin = None

logger = logging.getLogger(__name__)

def init_firebase_from_env():
    """Initialize Firebase Admin SDK using FIREBASE_SERVICE_ACCOUNT env var (JSON string)
    or fallback to GOOGLE_APPLICATION_CREDENTIALS file path.
    Call this early in scheduler worker or any module that needs messaging.
    """
    if firebase_admin is None:
        logger.warning("firebase_admin not installed; skip initialization")
        return None

    if firebase_admin._apps:
        return firebase_admin

    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    try:
        if sa_json:
            sa = json.loads(sa_json)
            cred = credentials.Certificate(sa)
            firebase_admin.initialize_app(cred)
            logger.info("Initialized Firebase Admin from FIREBASE_SERVICE_ACCOUNT env")
            return firebase_admin
        else:
            cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Initialized Firebase Admin from GOOGLE_APPLICATION_CREDENTIALS file")
                return firebase_admin
            else:
                logger.warning("No Firebase credentials found in env; messaging disabled")
                return None
    except Exception as e:
        logger.exception("Failed to initialize Firebase Admin: %s", e)
        return None


if __name__ == '__main__':
    init_firebase_from_env()
