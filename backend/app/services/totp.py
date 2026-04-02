from __future__ import annotations

import time

import pyotp


TOTP_INTERVAL_SECONDS = 30


def generate_totp_secret() -> str:
    """Generate a random Base32 secret for a member."""

    return pyotp.random_base32()


def get_current_totp_code(secret: str) -> tuple[str, int]:
    """Return the current 6-digit code and seconds remaining in the window."""

    totp = pyotp.TOTP(secret, interval=TOTP_INTERVAL_SECONDS)
    code = totp.now()
    now = int(time.time())
    remaining = TOTP_INTERVAL_SECONDS - (now % TOTP_INTERVAL_SECONDS)
    return code, remaining


def verify_totp_code(secret: str, code: str) -> bool:
    """Verify a submitted code, allowing a +-1 window for clock drift."""

    totp = pyotp.TOTP(secret, interval=TOTP_INTERVAL_SECONDS)
    return bool(totp.verify(code, valid_window=1))
