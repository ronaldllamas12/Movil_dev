"""Servicio de correo para flujos de autenticación."""

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode

from fastapi import HTTPException


def _get_required_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value

    primary = names[0] if names else "ENV_VAR"
    aliases = f" (aliases: {', '.join(names[1:])})" if len(names) > 1 else ""
    raise HTTPException(
        status_code=500,
        detail=(
            f"Falta configurar la variable de entorno {primary}{aliases} "
            "para envío de correos."
        ),
    )


def _get_smtp_port() -> int:
    raw_port = _get_required_env("SMTP_PORT", "PORT", "Port")
    raw_port = raw_port.split(",")[0].strip()

    try:
        return int(raw_port)
    except ValueError as exc:  # noqa: PERF203
        raise HTTPException(
            status_code=500,
            detail="SMTP_PORT debe ser un número válido.",
        ) from exc


def _get_optional_env(default: str, *names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value

    return default


def send_password_reset_email(*, recipient_email: str, token: str) -> None:
    """Envía el enlace de recuperación de contraseña al correo del usuario."""
    smtp_host = _get_optional_env("live.smtp.mailtrap.io", "SMTP_HOST", "HOST", "Host")
    smtp_port = _get_smtp_port()
    smtp_user = _get_required_env("SMTP_USER", "USERNAME", "Username")
    smtp_password = _get_required_env("SMTP_PASSWORD", "PASSWORD", "Password")

    mail_from = _get_required_env("MAIL_FROM")
    mail_from_name = _get_optional_env("Movil Dev", "MAIL_FROM_NAME") or "Movil Dev"

    frontend_url = _get_required_env("FRONTEND_URL").rstrip("/")
    reset_path = _get_optional_env("/login", "RESET_PASSWORD_PATH") or "/login"
    if not reset_path.startswith("/"):
        reset_path = f"/{reset_path}"

    query = urlencode({"token": token})
    reset_url = f"{frontend_url}{reset_path}?{query}"

    message = EmailMessage()
    message["Subject"] = "Recuperación de contraseña - Movil Dev"
    message["From"] = f"{mail_from_name} <{mail_from}>"
    message["To"] = recipient_email
    message.set_content(
        ""
        "Hola,\n\n"
        "Recibimos una solicitud para restablecer tu contraseña.\n"
        "Usa el siguiente enlace:\n\n"
        f"{reset_url}\n\n"
        "Si no solicitaste este cambio, puedes ignorar este correo.\n"
        ""
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail="No se pudo enviar el correo de recuperación en este momento.",
        ) from exc
