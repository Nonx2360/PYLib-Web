from __future__ import annotations

import base64
import hashlib
import hmac as std_hmac
import os
from typing import Any

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, hmac, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from app.core.config import get_settings


settings = get_settings()


def _derive_key(secret: str) -> bytes:
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_value(value: str) -> str:
    key = _derive_key(settings.encryption_secret)
    iv = os.urandom(16)
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(value.encode("utf-8")) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    return base64.b64encode(iv + ciphertext).decode("utf-8")


def decrypt_value(token: str) -> str:
    key = _derive_key(settings.encryption_secret)
    data = base64.b64decode(token)
    iv, ciphertext = data[:16], data[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    plaintext = unpadder.update(padded) + unpadder.finalize()
    return plaintext.decode("utf-8")


def compute_integrity(payload: dict[str, Any]) -> str:
    h = hmac.HMAC(_derive_key(settings.hmac_secret), hashes.SHA256(), backend=default_backend())
    encoded = "|".join(f"{key}:{payload[key]}" for key in sorted(payload))
    h.update(encoded.encode("utf-8"))
    return base64.b64encode(h.finalize()).decode("utf-8")


def verify_integrity(payload: dict[str, Any], signature: str) -> bool:
    expected = compute_integrity(payload)
    return std_hmac.compare_digest(expected, signature)
