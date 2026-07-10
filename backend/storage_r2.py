"""Cloudflare R2 file storage (S3-compatible API).

The bucket is private — files are served via short-lived presigned URLs
generated on demand, not permanent public links, because several of the
file types stored here (Aadhaar images, signatures) are sensitive KYC
documents that shouldn't be reachable forever by anyone who has ever seen
the URL.
"""
import os
import boto3
from botocore.config import Config

R2_ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL", "")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "")

_client = None


def r2_enabled() -> bool:
    return bool(R2_ENDPOINT_URL and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME)


def get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT_URL,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _client


def upload_bytes(key: str, data: bytes, content_type: str) -> None:
    get_client().put_object(Bucket=R2_BUCKET_NAME, Key=key, Body=data, ContentType=content_type)


def delete_object(key: str) -> None:
    get_client().delete_object(Bucket=R2_BUCKET_NAME, Key=key)


def presigned_url(key: str, expires_in: int = 3600) -> str:
    """A time-limited URL (default 1 hour) for reading one object — generated
    fresh on every request rather than stored, so nothing is servable forever
    from a leaked/bookmarked link."""
    return get_client().generate_presigned_url(
        "get_object", Params={"Bucket": R2_BUCKET_NAME, "Key": key}, ExpiresIn=expires_in,
    )
