"""
IntelliPresence — AWS Rekognition Attendance Detector
Scans classroom group captures, matches detected faces against the enrolled collection,
and outputs verified roll-call attendance records.
"""

import os
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional, Any

COLLECTION_ID = os.getenv("AWS_REKOGNITION_COLLECTION_ID", "intellipresence-faces-collection")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MATCH_CONFIDENCE_THRESHOLD = float(os.getenv("REKOGNITION_THRESHOLD", "85.0"))


class AttendanceDetector:
    """Processes group classroom captures and identifies enrolled students."""

    def __init__(self, region_name: str = AWS_REGION, threshold: float = MATCH_CONFIDENCE_THRESHOLD):
        self.region = region_name
        self.threshold = threshold
        self.client = boto3.client("rekognition", region_name=self.region)

    def detect_classroom_attendance(
        self,
        image_bytes: Optional[bytes] = None,
        s3_bucket: Optional[str] = None,
        s3_key: Optional[str] = None,
        collection_id: str = COLLECTION_ID,
        max_faces_to_search: int = 100,
    ) -> Dict[str, Any]:
        """
        Processes a full classroom group photograph or RTSP frame:
        1. Calls detect_faces to count total individuals present in the lecture hall.
        2. Calls search_faces_by_image to match detected faces against the enrolled student collection.
        3. Returns recognized students, confidence scores, and unassigned faces.
        
        Args:
            image_bytes: Direct image buffer.
            s3_bucket: S3 Bucket storing the uploaded classroom picture.
            s3_key: S3 object key.
            collection_id: The Rekognition collection to match against.
            max_faces_to_search: Maximum matches to inspect in the classroom image.
        """
        image_source = {}
        if s3_bucket and s3_key:
            image_source = {"S3Object": {"Bucket": s3_bucket, "Name": s3_key}}
        elif image_bytes:
            image_source = {"Bytes": image_bytes}
        else:
            raise ValueError("Either image_bytes or (s3_bucket, s3_key) must be provided.")

        try:
            # Step 1: Detect total faces in the room (crowd count)
            detect_resp = self.client.detect_faces(
                Image=image_source,
                Attributes=["DEFAULT"],
            )
            total_heads_detected = len(detect_resp.get("FaceDetails", []))

            # Step 2: Search matching faces against enrolled database collection
            search_resp = self.client.search_faces_by_image(
                CollectionId=collection_id,
                Image=image_source,
                MaxFaces=max_faces_to_search,
                FaceMatchThreshold=self.threshold,
            )

            matched_faces = search_resp.get("FaceMatches", [])
            recognized_students = []
            seen_students = set()

            for match in matched_faces:
                similarity = match.get("Similarity", 0.0)
                face_data = match.get("Face", {})
                external_id = face_data.get("ExternalImageId")

                if external_id and external_id not in seen_students:
                    seen_students.add(external_id)
                    recognized_students.append({
                        "student_id": external_id,
                        "similarity_pct": round(similarity, 2),
                        "confidence_score": round(face_data.get("Confidence", 0.0), 2),
                        "face_id": face_data.get("FaceId"),
                        "status": "present",
                    })

            return {
                "success": True,
                "total_faces_detected": total_heads_detected,
                "total_students_matched": len(recognized_students),
                "students": recognized_students,
                "unmatched_faces_count": max(0, total_heads_detected - len(recognized_students)),
                "threshold_applied": self.threshold,
            }

        except ClientError as e:
            return {
                "success": False,
                "error": str(e),
                "total_faces_detected": 0,
                "total_students_matched": 0,
                "students": [],
            }


if __name__ == "__main__":
    detector = AttendanceDetector()
    print("Rekognition AttendanceDetector initialized with threshold:", detector.threshold)
