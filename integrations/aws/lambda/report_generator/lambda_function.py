"""
IntelliPresence — AWS Lambda: Asynchronous Report Compiler
Generates institution-wide attendance export files (CSV/Summary) and saves them
directly to Amazon S3 with presigned temporary download URLs.
"""

import csv
import io
import json
import os
import boto3
from datetime import datetime

s3 = boto3.client("s3")
REPORTS_BUCKET = os.getenv("AWS_S3_REPORTS_BUCKET", "attendai-reports-storage")
PRESIGNED_EXPIRATION_SECONDS = 3600  # 1 hour


def lambda_handler(event, context):
    """
    Handles report generation requests from Flask backend or SQS worker queues.
    
    Expected event payload:
    {
        "report_id": "rep_12345",
        "report_type": "monthly",
        "format": "CSV",
        "organization_id": "org_uuid",
        "date_from": "2026-06-01",
        "date_to": "2026-07-01",
        "records": [
            {"student_name": "Rahul Sharma", "roll_number": "CS2101", "course": "Algorithms", "present": 24, "total": 26, "pct": 92.3}
        ]
    }
    """
    print(f"[Lambda ReportGen] Processing report request: {json.dumps(event.get('report_id'))}")

    report_id = event.get("report_id", f"rep_{int(datetime.utcnow().timestamp())}")
    report_format = event.get("format", "CSV").upper()
    records = event.get("records", [])

    if not records:
        # Default mock sample rows for standalone testing
        records = [
            {"student_name": "Rahul Sharma", "roll_number": "CS2101", "course": "CS301 - Algorithms", "present": 24, "total": 26, "pct": 92.3},
            {"student_name": "Pooja Patel", "roll_number": "CS2102", "course": "CS301 - Algorithms", "present": 22, "total": 26, "pct": 84.6},
            {"student_name": "Aman Verma", "roll_number": "CS2103", "course": "CS302 - Databases", "present": 25, "total": 26, "pct": 96.1},
            {"student_name": "Neha Gupta", "roll_number": "CS2104", "course": "CS302 - Databases", "present": 18, "total": 26, "pct": 69.2},
        ]

    # Generate CSV payload
    output = io.StringIO()
    writer = csv.writer(output)

    # Header section
    writer.writerow(["IntelliPresence Attendance Export Report"])
    writer.writerow([f"Report ID: {report_id}", f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"])
    writer.writerow([f"Date Range: {event.get('date_from', 'N/A')} to {event.get('date_to', 'N/A')}"])
    writer.writerow([])  # Empty spacing line

    # Table columns
    writer.writerow(["Student Full Name", "Roll Number", "Course Title", "Lectures Present", "Total Held", "Attendance %", "Standing"])

    for row in records:
        standing = "Good Standing" if row.get("pct", 0) >= 75.0 else "Defaulter (<75%)"
        writer.writerow([
            row.get("student_name"),
            row.get("roll_number"),
            row.get("course"),
            row.get("present"),
            row.get("total"),
            f"{row.get('pct')}%",
            standing,
        ])

    csv_content = output.getvalue().encode("utf-8")
    s3_key = f"compiled-reports/{report_id}.csv"

    # Upload to S3 Bucket
    try:
        s3.put_object(
            Bucket=REPORTS_BUCKET,
            Key=s3_key,
            Body=csv_content,
            ContentType="text/csv",
            Metadata={
                "report_id": report_id,
                "generated_by": "IntelliPresence-Serverless-Lambda",
            },
        )
        print(f"[Lambda ReportGen] Successfully uploaded s3://{REPORTS_BUCKET}/{s3_key}")

        # Generate secure presigned download link
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": REPORTS_BUCKET, "Key": s3_key},
            ExpiresIn=PRESIGNED_EXPIRATION_SECONDS,
        )

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "ready",
                "report_id": report_id,
                "s3_bucket": REPORTS_BUCKET,
                "s3_key": s3_key,
                "download_url": presigned_url,
                "expires_in_seconds": PRESIGNED_EXPIRATION_SECONDS,
            }),
        }

    except Exception as err:
        print(f"[Lambda ReportGen Error] S3 upload failed: {err}")
        return {
            "statusCode": 500,
            "body": json.dumps({"status": "failed", "error": str(err)}),
        }
