"""
IntelliPresence — AWS Rekognition Face Indexer
Manages the Amazon Rekognition Face Collection and indexes student biometric embeddings.
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional, Any

COLLECTION_ID = os.getenv("AWS_REKOGNITION_COLLECTION_ID", "intellipresence-faces-collection")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


class FaceIndexer:
    """Handles creation of Rekognition collections and student face enrollment."""

    def __init__(self, region_name: str = AWS_REGION):
        self.region = region_name
        self.client = boto3.client("rekognition", region_name=self.region)

    def ensure_collection(self, collection_id: str = COLLECTION_ID) -> bool:
        """
        Creates the Rekognition Collection if it does not already exist.
        Rekognition collections store vector embeddings of faces (not original photos).
        """
        try:
            self.client.describe_collection(CollectionId=collection_id)
            print(f"[Rekognition] Collection '{collection_id}' already exists and is active.")
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                print(f"[Rekognition] Creating new collection '{collection_id}'...")
                self.client.create_collection(CollectionId=collection_id)
                print(f"[Rekognition] Collection '{collection_id}' created successfully.")
                return True
            else:
                print(f"[Rekognition] Error checking collection: {e}")
                return False

    def index_student_face(
        self,
        student_id: str,
        image_bytes: Optional[bytes] = None,
        s3_bucket: Optional[str] = None,
        s3_key: Optional[str] = None,
        collection_id: str = COLLECTION_ID,
        detection_attributes: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Indexes a single student's face embedding into the Rekognition collection.
        Associates the student's unique UUID / Roll Number via ExternalImageId.
        
        Args:
            student_id: Unique identifier for the student (alphanumeric + safe chars).
            image_bytes: Raw bytes of the enrollment photo (if uploading directly).
            s3_bucket: S3 bucket name (if stored in S3).
            s3_key: S3 object key.
            collection_id: Rekognition collection target.
            detection_attributes: Optional face attributes to return (e.g. ['ALL']).
        """
        if detection_attributes is None:
            detection_attributes = ["DEFAULT"]

        image_source = {}
        if s3_bucket and s3_key:
            image_source = {"S3Object": {"Bucket": s3_bucket, "Name": s3_key}}
        elif image_bytes:
            image_source = {"Bytes": image_bytes}
        else:
            raise ValueError("Either image_bytes or (s3_bucket, s3_key) must be provided.")

        try:
            # ExternalImageId only permits [a-zA-Z0-9_.\-:]
            safe_student_id = student_id.replace(" ", "_")

            response = self.client.index_faces(
                CollectionId=collection_id,
                Image=image_source,
                ExternalImageId=safe_student_id,
                DetectionAttributes=detection_attributes,
                MaxFaces=1,  # Enrollment photos must have strictly 1 face
                QualityFilter="AUTO",
            )

            indexed_faces = response.get("FaceRecords", [])
            unindexed_faces = response.get("UnindexedFaces", [])

            if not indexed_faces:
                reasons = [u.get("Reasons", ["Unknown"]) for u in unindexed_faces]
                return {
                    "success": False,
                    "student_id": student_id,
                    "error": f"Face could not be indexed. Quality check failed: {reasons}",
                }

            face_record = indexed_faces[0]
            face_id = face_record["Face"]["FaceId"]
            confidence = face_record["Face"]["Confidence"]

            return {
                "success": True,
                "student_id": student_id,
                "face_id": face_id,
                "confidence": confidence,
                "bounding_box": face_record["Face"]["BoundingBox"],
            }

        except ClientError as e:
            return {
                "success": False,
                "student_id": student_id,
                "error": str(e),
            }

    def delete_student_face(self, face_id: str, collection_id: str = COLLECTION_ID) -> bool:
        """Removes a student's face embedding from the collection (e.g. upon graduation/deactivation)."""
        try:
            response = self.client.delete_faces(
                CollectionId=collection_id,
                FaceIds=[face_id],
            )
            deleted = response.get("DeletedFaces", [])
            return face_id in deleted
        except ClientError as e:
            print(f"[Rekognition] Error deleting face {face_id}: {e}")
            return False


if __name__ == "__main__":
    print("Testing Rekognition FaceIndexer initialization...")
    indexer = FaceIndexer()
    print("Rekognition client initialized for region:", indexer.region)
