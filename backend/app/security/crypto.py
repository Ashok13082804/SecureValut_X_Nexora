import os
import base64
import hashlib
from Crypto.Cipher import AES
from ..config.settings import settings

class CryptoService:
    def __init__(self):
        # Master key (32 bytes)
        raw_master = bytes.fromhex(settings.AES_MASTER_KEY)
        if len(raw_master) != 32:
            raw_master = hashlib.sha256(settings.AES_MASTER_KEY.encode()).digest()
        self.master_key = raw_master

    @staticmethod
    def calculate_sha256(data: bytes) -> str:
        """Calculate SHA-256 hash of byte content."""
        return hashlib.sha256(data).hexdigest()

    def generate_file_key(self) -> bytes:
        """Generate a cryptographically secure 256-bit random key for a single file."""
        return os.urandom(32)

    def wrap_file_key(self, file_key: bytes) -> str:
        """Wrap the per-file key using the master key with AES-256-GCM."""
        nonce = os.urandom(12)
        cipher = AES.new(self.master_key, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(file_key)
        # Store as base64(nonce + tag + ciphertext)
        combined = nonce + tag + ciphertext
        return base64.b64encode(combined).decode('utf-8')

    def unwrap_file_key(self, wrapped_key_b64: str) -> bytes:
        """Unwrap the per-file key using the master key."""
        combined = base64.b64decode(wrapped_key_b64)
        nonce = combined[:12]
        tag = combined[12:28]
        ciphertext = combined[28:]
        cipher = AES.new(self.master_key, AES.MODE_GCM, nonce=nonce)
        file_key = cipher.decrypt_and_verify(ciphertext, tag)
        return file_key

    def encrypt_file_data(self, plaintext: bytes) -> dict:
        """
        Encrypt file data using AES-256-GCM with a unique per-file key.
        Returns:
            - ciphertext (bytes)
            - sha256_plaintext (str)
            - nonce_b64 (str)
            - tag_b64 (str)
            - encrypted_key_b64 (str)
            - key_fingerprint (str)
        """
        sha256_hash = self.calculate_sha256(plaintext)
        file_key = self.generate_file_key()
        key_fingerprint = hashlib.sha256(file_key).hexdigest()[:16]
        
        nonce = os.urandom(12)
        cipher = AES.new(file_key, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(plaintext)
        
        wrapped_key_b64 = self.wrap_file_key(file_key)
        
        return {
            "ciphertext": ciphertext,
            "sha256_plaintext": sha256_hash,
            "nonce_b64": base64.b64encode(nonce).decode('utf-8'),
            "tag_b64": base64.b64encode(tag).decode('utf-8'),
            "encrypted_key_b64": wrapped_key_b64,
            "key_fingerprint": key_fingerprint,
            "algorithm": "AES-256-GCM"
        }

    def decrypt_file_data(
        self,
        ciphertext: bytes,
        nonce_b64: str,
        tag_b64: str,
        wrapped_key_b64: str,
        expected_sha256: str = None
    ) -> tuple[bytes, bool]:
        """
        Decrypt file data using AES-256-GCM and verify integrity.
        Returns: (plaintext_bytes, integrity_valid)
        """
        file_key = self.unwrap_file_key(wrapped_key_b64)
        nonce = base64.b64decode(nonce_b64)
        tag = base64.b64decode(tag_b64)
        
        cipher = AES.new(file_key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        
        integrity_valid = True
        if expected_sha256:
            actual_hash = self.calculate_sha256(plaintext)
            if actual_hash.lower() != expected_sha256.lower():
                integrity_valid = False
                
        return plaintext, integrity_valid

crypto_service = CryptoService()
