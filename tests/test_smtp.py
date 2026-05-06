import os
import smtplib

import pytest
from dotenv import load_dotenv


def test_smtp_live_connection_optional() -> None:
    """Live SMTP smoke test, disabled by default in CI/local pytest runs."""
    if os.getenv("RUN_SMTP_LIVE_TESTS", "0") != "1":
        pytest.skip("Set RUN_SMTP_LIVE_TESTS=1 to run live SMTP connectivity checks.")

    load_dotenv()

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", 587))
    user = os.getenv("SMTP_USER")
    pw = os.getenv("SMTP_PASSWORD")

    assert host, "SMTP_HOST is required"
    assert user, "SMTP_USER is required"
    assert pw, "SMTP_PASSWORD is required"

    smtp = smtplib.SMTP(host, port, timeout=10)
    try:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(user, pw)
    finally:
        smtp.quit()
