"""Fernet encryption utilities for sensitive values (API keys, etc.)."""
import os
import logging
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

_fernet_instance: Fernet | None = None


def _get_fernet() -> Fernet:
    """Get or initialize Fernet instance using FERNET_KEY env var."""
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance

    key = os.getenv("FERNET_KEY")
    if not key:
        key = Fernet.generate_key().decode()
        logger.warning(
            "FERNET_KEY not set — generated a temporary key. "
            "Encrypted data will NOT survive restarts. "
            "Set FERNET_KEY env var for production. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    _fernet_instance = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet_instance


def encrypt_value(plaintext: str) -> str:
    """Encrypt a plaintext string and return the ciphertext as a UTF-8 string."""
    f = _get_fernet()
    return f.encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a ciphertext string and return the original plaintext."""
    f = _get_fernet()
    return f.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
