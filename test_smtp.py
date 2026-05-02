import os
import smtplib
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("SMTP_HOST")
port = int(os.getenv("SMTP_PORT", 587))
user = os.getenv("SMTP_USER")
pw = os.getenv("SMTP_PASSWORD")

print(f"Host: {host}:{port}")
print(f"User: {user}")
print(f"Pass: {pw[:6]}..." if pw else "Pass: (vacío)")

try:
    s = smtplib.SMTP(host, port, timeout=10)
    s.ehlo()
    s.starttls()
    s.ehlo()
    s.login(user, pw)
    print("LOGIN OK - Conexión SMTP exitosa")
    s.quit()
except Exception as e:
    print(f"ERROR: {e}")
