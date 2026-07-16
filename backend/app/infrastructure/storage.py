from abc import ABC, abstractmethod
import io

class IStorageService(ABC):
    @abstractmethod
    def save_file(self, file_bytes: bytes, filename: str) -> str: pass

class LocalStorageService(IStorageService):
    def __init__(self, upload_dir: str = "./uploads"):
        self.upload_dir = upload_dir
        import os
        os.makedirs(upload_dir, exist_ok=True)

    def save_file(self, file_bytes: bytes, filename: str) -> str:
        import os
        import uuid
        unique_name = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(self.upload_dir, unique_name)
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{unique_name}"

class S3StorageService(IStorageService):
    def __init__(self, bucket_name: str, aws_access_key_id: str, aws_secret_access_key: str, endpoint_url: str):
        self.bucket_name = bucket_name
        import boto3
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            endpoint_url=endpoint_url
        )

    def save_file(self, file_bytes: bytes, filename: str) -> str:
        import uuid
        unique_name = f"{uuid.uuid4()}_{filename}"
        self.s3_client.upload_fileobj(
            io.BytesIO(file_bytes),
            self.bucket_name,
            unique_name
        )
        return f"{self.bucket_name}/{unique_name}"
