import os

class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    DATABASE_URL = os.getenv("DATABASE_URL")

    # AWS Configuration
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "attendai-reports-storage")

    # n8n Configuration
    N8N_ANOMALY_WEBHOOK_URL = os.getenv("N8N_ANOMALY_WEBHOOK_URL")
    N8N_SECRET_TOKEN = os.getenv("N8N_SECRET_TOKEN")

    @classmethod
    def validate(cls):
        """Validate critical credentials exist on startup."""
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_JWT_SECRET:
            missing.append("SUPABASE_JWT_SECRET")
        if not cls.DATABASE_URL:
            missing.append("DATABASE_URL")
        return missing
