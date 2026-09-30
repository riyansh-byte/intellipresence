"""
IntelliPresence — AWS SES Email Service
Dispatches transactional emails for low-attendance warnings, teacher/student invitations,
and weekly attendance digests via Amazon Simple Email Service (SES).
"""

import os
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
SES_SENDER_EMAIL = os.getenv("AWS_SES_SENDER", "notifications@intellipresence.edu")


class EmailService:
    """Manages transactional email delivery via Amazon SES with local fallback."""

    def __init__(self, region_name: str = AWS_REGION, sender: str = SES_SENDER_EMAIL):
        self.region = region_name
        self.sender = sender
        try:
            self.client = boto3.client("ses", region_name=region_name)
            self.has_aws = True
        except Exception:
            self.client = None
            self.has_aws = False

    def send_low_attendance_alert(
        self,
        recipient_email: str,
        student_name: str,
        current_rate: float,
        course_name: str,
        classes_needed: int,
    ) -> Dict[str, Any]:
        """Sends an urgent notification when attendance falls below 75%."""
        subject = f"[Action Required] Low Attendance Warning — {student_name}"
        body_text = (
            f"Dear {student_name},\n\n"
            f"Your current attendance in {course_name} has dropped to {current_rate:.1f}% "
            f"(Institutional statutory minimum is 75.0%).\n"
            f"You need to attend at least {classes_needed} consecutive upcoming lectures "
            f"to restore your examination eligibility.\n\n"
            f"Please log in to your IntelliPresence student portal or consult your faculty advisor."
        )

        body_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ef4444; color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
    <h2 style="margin: 0;">Attendance Alert: Below 75% Threshold</h2>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #ffffff;">
    <p>Dear <strong>{student_name}</strong>,</p>
    <p>This automated advisory informs you that your verified lecture attendance has fallen below the mandatory 75% threshold:</p>
    <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Course:</strong> {course_name}</p>
      <p style="margin: 4px 0;"><strong>Current Attendance:</strong> <span style="color: #b91c1c; font-weight: bold; font-size: 16px;">{current_rate:.1f}%</span></p>
      <p style="margin: 4px 0;"><strong>Lectures Required to Recover:</strong> {classes_needed} consecutive sessions</p>
    </div>
    <p>Please meet with your course instructor to discuss makeup sessions and excuse tokens.</p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:3000/student/attendance" style="background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Attendance Portal
      </a>
    </div>
  </div>
</body>
</html>"""

        return self._send_email(recipient_email, subject, body_text, body_html)

    def send_invitation(
        self,
        recipient_email: str,
        full_name: str,
        role: str,
        invite_token: str,
    ) -> Dict[str, Any]:
        """Dispatches onboarding invitation links for new faculty and student profiles."""
        subject = f"You're invited to join IntelliPresence as a {role.capitalize()}"
        invite_url = f"http://localhost:3000/register?token={invite_token}"
        body_text = f"Hello {full_name},\n\nYou have been invited to join your institution's IntelliPresence workspace. Complete registration at: {invite_url}"
        body_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h2 style="margin: 0;">Welcome to IntelliPresence</h2>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hello <strong>{full_name}</strong>,</p>
    <p>Your institutional administrator has created an account for you with the role of <strong>{role.capitalize()}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invite_url}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Accept Invitation & Setup Password
      </a>
    </div>
  </div>
</body>
</html>"""

        return self._send_email(recipient_email, subject, body_text, body_html)

    def _send_email(self, to_address: str, subject: str, body_text: str, body_html: str) -> Dict[str, Any]:
        """Handles SES API invocation with fallback simulation if AWS credentials are not live."""
        if not self.has_aws or not os.getenv("AWS_ACCESS_KEY_ID"):
            print(f"[SES Simulated Dispatch] Email sent to {to_address} | Subject: '{subject}'")
            return {
                "success": True,
                "status": "simulated",
                "message_id": f"simulated_msg_{int(os.getpid())}",
                "recipient": to_address,
            }

        try:
            response = self.client.send_email(
                Source=self.sender,
                Destination={"ToAddresses": [to_address]},
                Message={
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": body_text, "Charset": "UTF-8"},
                        "Html": {"Data": body_html, "Charset": "UTF-8"},
                    },
                },
            )
            return {
                "success": True,
                "status": "sent",
                "message_id": response["MessageId"],
                "recipient": to_address,
            }
        except ClientError as e:
            print(f"[SES Error] Failed sending to {to_address}: {e}")
            return {"success": False, "error": str(e), "recipient": to_address}


if __name__ == "__main__":
    service = EmailService()
    print("Testing email service...")
    res = service.send_low_attendance_alert(
        recipient_email="student@example.com",
        student_name="Rahul Sharma",
        current_rate=68.4,
        course_name="CS301 Algorithms",
        classes_needed=3,
    )
    print("Result:", res)
