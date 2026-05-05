"""Servicio de envio por SMTP para facturas de ordenes."""

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path


def send_invoice_email(recipient_email: str, invoice_pdf_path: Path, order) -> bool:
    """Envia la factura adjunta por email. Retorna True/False."""
    try:
        smtp_provider = os.getenv("SMTP_PROVIDER", "gmail").strip().lower()
        default_host = "smtp.gmail.com" if smtp_provider == "gmail" else "localhost"
        default_port = 587

        smtp_host = os.getenv("SMTP_HOST_GMAIL", default_host).strip()
        smtp_port = int(os.getenv("SMTP_PORT", default_port))
        smtp_user = os.getenv("SMTP_USER_GMAIL", "").strip()
        smtp_pass = (
            os.getenv("SMTP_PASSWORD_GMAIL", "").strip()
            or os.getenv("GMAIL_APP_PASSWORD", "").strip()
        )
        mail_from = os.getenv("MAIL_FROM_GMAIL", smtp_user or "no-reply@movildev.com").strip()
        mail_from_name = os.getenv("MAIL_FROM_NAME", "Movil Dev").strip()

        if not smtp_user or not smtp_pass:
            print("[EMAIL ERROR] Faltan credenciales SMTP_USER/SMTP_PASSWORD.")
            return False

        msg = EmailMessage()
        msg["Subject"] = f"Factura de tu pedido #{order.id} - Movil Dev"
        msg["From"] = f"{mail_from_name} <{mail_from}>"
        msg["To"] = recipient_email
        msg.set_content(
            "Hola,\n\n"
            f"Adjuntamos la factura de tu pedido #{order.id}.\n"
            "Gracias por tu compra en Movil Dev.\n"
        )

        with open(invoice_pdf_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="pdf",
                filename=f"factura_pedido_{order.id}.pdf",
            )

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] No se pudo enviar email de factura: {exc}")
        return False
