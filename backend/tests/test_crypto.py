import pytest
from backend.app.security.crypto import crypto_service

def test_aes_gcm_encrypt_decrypt():
    original_data = b"TOP SECRET: Zero-Trust Defense Blueprint 2026."
    enc_res = crypto_service.encrypt_file_data(original_data)
    
    assert enc_res["ciphertext"] != original_data
    assert enc_res["algorithm"] == "AES-256-GCM"
    assert "nonce_b64" in enc_res
    assert "tag_b64" in enc_res
    
    decrypted, is_valid = crypto_service.decrypt_file_data(
        ciphertext=enc_res["ciphertext"],
        nonce_b64=enc_res["nonce_b64"],
        tag_b64=enc_res["tag_b64"],
        wrapped_key_b64=enc_res["encrypted_key_b64"],
        expected_sha256=enc_res["sha256_plaintext"]
    )
    
    assert is_valid is True
    assert decrypted == original_data

def test_tampered_ciphertext_fails_verification():
    original_data = b"Confidential Financial Audit."
    enc_res = crypto_service.encrypt_file_data(original_data)
    
    # Tamper with 1 byte of ciphertext
    tampered_bytes = bytearray(enc_res["ciphertext"])
    tampered_bytes[0] ^= 0xFF
    
    with pytest.raises(Exception):
        crypto_service.decrypt_file_data(
            ciphertext=bytes(tampered_bytes),
            nonce_b64=enc_res["nonce_b64"],
            tag_b64=enc_res["tag_b64"],
            wrapped_key_b64=enc_res["encrypted_key_b64"],
            expected_sha256=enc_res["sha256_plaintext"]
        )
