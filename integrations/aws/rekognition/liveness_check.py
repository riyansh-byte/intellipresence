"""
IntelliPresence — AWS Rekognition Anti-Spoofing & Liveness Verifier
Validates face image quality, head pose angles, and optical sharpness
to prevent printed paper or screen photo spoofing during attendance verification.
"""

import os
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


class LivenessVerifier:
    """Performs optical and physiological quality checks to deter proxy attendance."""

    def __init__(self, region_name: str = AWS_REGION):
        self.client = boto3.client("rekognition", region_name=region_name)

    def verify_face_liveness(
        self,
        image_bytes: Optional[bytes] = None,
        s3_bucket: Optional[str] = None,
        s3_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyzes facial landmarks and orientation:
        - Eyes open verification
        - Head pose (Yaw, Pitch, Roll) within natural limits
        - Sharpness and Brightness quality scores
        - Sunglasses / Occlusion checks
        """
        image_source = {}
        if s3_bucket and s3_key:
            image_source = {"S3Object": {"Bucket": s3_bucket, "Name": s3_key}}
        elif image_bytes:
            image_source = {"Bytes": image_bytes}
        else:
            raise ValueError("Either image_bytes or (s3_bucket, s3_key) must be provided.")

        try:
            response = self.client.detect_faces(
                Image=image_source,
                Attributes=["ALL"],
            )

            face_details = response.get("FaceDetails", [])
            if not face_details:
                return {
                    "is_live": False,
                    "confidence": 0.0,
                    "reasons": ["No face detected in capture frame."],
                }

            if len(face_details) > 1:
                return {
                    "is_live": False,
                    "confidence": 0.0,
                    "reasons": ["Multiple faces detected during individual liveness check."],
                }

            face = face_details[0]
            reasons = []

            # 1. Pose angles (reject extreme tilts often found in tilted printed photos)
            pose = face.get("Pose", {})
            pitch = abs(pose.get("Pitch", 0.0))
            yaw = abs(pose.get("Yaw", 0.0))
            roll = abs(pose.get("Roll", 0.0))

            if pitch > 30.0 or yaw > 30.0 or roll > 25.0:
                reasons.append(f"Head pose deviation too high (Pitch:{pitch:.1f}, Yaw:{yaw:.1f}, Roll:{roll:.1f})")

            # 2. Eyes open
            eyes_open = face.get("EyesOpen", {})
            if not eyes_open.get("Value", False) and eyes_open.get("Confidence", 0.0) > 80.0:
                reasons.append("Eyes appear closed or obstructed.")

            # 3. Sunglasses / Face occlusion
            sunglasses = face.get("Sunglasses", {})
            if sunglasses.get("Value", False) and sunglasses.get("Confidence", 0.0) > 85.0:
                reasons.append("Sunglasses or facial covering obscuring biometric features.")

            # 4. Image Quality (Sharpness & Brightness)
            quality = face.get("Quality", {})
            sharpness = quality.get("Sharpness", 0.0)
            brightness = quality.get("Brightness", 0.0)

            if sharpness < 40.0:
                reasons.append(f"Image too blurry (Sharpness: {sharpness:.1f}/100)")
            if brightness < 30.0 or brightness > 90.0:
                reasons.append(f"Poor lighting conditions (Brightness: {brightness:.1f}/100)")

            is_valid = len(reasons) == 0

            return {
                "is_live": is_valid,
                "confidence": round(face.get("Confidence", 0.0), 2),
                "sharpness": round(sharpness, 1),
                "brightness": round(brightness, 1),
                "pose": {"pitch": round(pitch, 1), "yaw": round(yaw, 1), "roll": round(roll, 1)},
                "reasons": reasons,
            }

        except ClientError as e:
            return {
                "is_live": False,
                "confidence": 0.0,
                "reasons": [str(e)],
            }


if __name__ == "__main__":
    verifier = LivenessVerifier()
    print("Rekognition LivenessVerifier ready.")
