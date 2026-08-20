# IntelliPresence — AWS Integration

This directory contains all AWS cloud service integrations for the IntelliPresence platform.

## Structure

```
aws/
├── lambda/        # AWS Lambda functions (serverless compute)
├── rekognition/   # AWS Rekognition (face recognition for attendance)
├── s3/            # AWS S3 (file & media storage)
└── ses/           # AWS SES (transactional email service)
```

## Services Used

| Service | Purpose |
|---|---|
| **Lambda** | Serverless functions for attendance processing, scheduled jobs |
| **Rekognition** | Face detection & recognition for biometric attendance |
| **S3** | Storage for student/staff photos, reports, exports |
| **SES** | Sending attendance alerts, reports, and notifications via email |

## Setup

1. Configure AWS credentials in `.env.local`:
   ```env
   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=intellipresence-media
   AWS_SES_FROM_EMAIL=no-reply@intellipresence.app
   ```

2. Deploy Lambda functions using AWS SAM or Serverless Framework.

3. Ensure IAM roles have the minimum required permissions for each service.
