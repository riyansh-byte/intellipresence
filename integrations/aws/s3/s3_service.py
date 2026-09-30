"""
IntelliPresence — AWS S3 Storage Service
Production client for presigned URL uploads/downloads, object lifecycles,
and storage cost optimization.
"""

import os
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
CAPTURES_BUCKET = os.getenv("AWS_S3_CAPTURES_BUCKET", "attendai-classroom-captures")
REPORTS_BUCKET = os.getenv("AWS_S3_REPORTS_BUCKET", "attendai-reports-storage")


class S3StorageService:
    """Manages secure S3 bucket transactions without exposing AWS credentials to web clients."""

    def __init__(self, region_name: str = AWS_REGION):
        self.region = region_name
        self.s3_client = boto3.client("s3", region_name=region_name)

    def generate_presigned_upload_url(
        self,
        bucket_name: str,
        object_key: str,
        content_type: str = "image/jpeg",
        expires_in: int = 900,  # 15 minutes
    ) -> Dict[str, Any]:
        """
        Generates a secure presigned PUT URL allowing the frontend client (Next.js)
        to upload directly to S3 without saturating backend API network bandwidth.
        """
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": bucket_name,
                    "Key": object_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            return {
                "success": True,
                "upload_url": url,
                "bucket": bucket_name,
                "key": object_key,
                "expires_in": expires_in,
            }
        except ClientError as e:
            return {"success": False, "error": str(e)}

    def generate_presigned_download_url(
        self,
        bucket_name: str,
        object_key: str,
        expires_in: int = 3600,  # 1 hour
    ) -> Optional[str]:
        """Generates a secure time-limited GET link for private PDF/CSV downloads."""
        try:
            return self.s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": bucket_name, "Key": object_key},
                ExpiresIn=expires_in,
            )
        except ClientError as e:
            print(f"[S3 Error] Failed to generate download URL: {e}")
            return None

    def upload_bytes(
        self,
        bucket_name: str,
        object_key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> bool:
        """Direct binary upload to S3."""
        try:
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=object_key,
                Body=data,
                ContentType=content_type,
            )
            return True
        except ClientError as e:
            print(f"[S3 Error] Upload failed: {e}")
            return False


if __name__ == "__main__":
    storage = S3StorageService()
    print("S3StorageService initialized in region:", storage.region)
