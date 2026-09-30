"""
IntelliPresence — AWS Lambda: Automated Attendance Processor
Triggered asynchronously by S3 upload events when a teacher or smart camera
uploads a classroom lecture photo.
"""

import json
import os
import urllib.parse
import urllib.request
import boto3

rekognition = boto3.client("rekognition")
s3 = boto3.client("s3")

COLLECTION_ID = os.getenv("AWS_REKOGNITION_COLLECTION_ID", "intellipresence-faces-collection")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000/api")
INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY", "attendai-internal-lambda-secret")
CONFIDENCE_THRESHOLD = float(os.getenv("REKOGNITION_THRESHOLD", "85.0"))


def lambda_handler(event, context):
    """
    AWS Lambda entrypoint triggered by s3:ObjectCreated events.
    Expected S3 key format: captures/{session_id}/{filename}.jpg
    """
    print(f"[Lambda] Received event: {json.dumps(event)}")

    # 1. Parse S3 bucket and object key from event
    try:
        record = event["Records"][0]
        bucket_name = record["s3"]["bucket"]["name"]
        raw_key = record["s3"]["object"]["key"]
        object_key = urllib.parse.unquote_plus(raw_key)
    except (KeyError, IndexError) as e:
        print(f"[Lambda Error] Invalid S3 event structure: {e}")
        return {"statusCode": 400, "body": "Invalid S3 event structure"}

    print(f"[Lambda] Processing classroom image s3://{bucket_name}/{object_key}")

    # Extract session_id from key convention: captures/<session_id>/<timestamp>.jpg
    parts = object_key.split("/")
    session_id = None
    if len(parts) >= 3 and parts[0] == "captures":
        session_id = parts[1]

    # 2. Call AWS Rekognition search_faces_by_image
    try:
        rek_response = rekognition.search_faces_by_image(
            CollectionId=COLLECTION_ID,
            Image={"S3Object": {"Bucket": bucket_name, "Name": object_key}},
            MaxFaces=100,
            FaceMatchThreshold=CONFIDENCE_THRESHOLD,
        )
    except Exception as err:
        print(f"[Lambda Error] Rekognition API call failed: {err}")
        return {"statusCode": 500, "body": f"Rekognition processing error: {str(err)}"}

    matched_faces = rek_response.get("FaceMatches", [])
    print(f"[Lambda] Rekognition matched {len(matched_faces)} faces with >= {CONFIDENCE_THRESHOLD}% confidence")

    # 3. Aggregate recognized student IDs
    present_records = []
    seen = set()

    for match in matched_faces:
        face = match.get("Face", {})
        student_id = face.get("ExternalImageId")
        similarity = match.get("Similarity", 0.0)

        if student_id and student_id not in seen:
            seen.add(student_id)
            present_records.append({
                "student_id": student_id,
                "status": "present",
                "similarity": round(similarity, 2),
            })

    # 4. Forward attendance records to backend API if session_id is available
    if session_id and present_records:
        post_url = f"{BACKEND_API_URL}/attendance/records"
        payload = json.dumps({
            "session_id": session_id,
            "records": [{"student_id": r["student_id"], "status": "present"} for r in present_records],
        }).encode("utf-8")

        req = urllib.request.Request(
            post_url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[Lambda] Successfully synced with backend API. HTTP Status: {resp.status}")
        except Exception as e:
            print(f"[Lambda Warning] Could not reach backend API at {post_url}: {e}")

    return {
        "statusCode": 200,
        "body": json.dumps({
            "status": "success",
            "session_id": session_id,
            "students_recognized": len(present_records),
            "records": present_records,
        }),
    }
