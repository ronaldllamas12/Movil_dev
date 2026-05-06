"""Application settings loaded from environment variables."""

from __future__ import annotations

import os


def _parse_csv_env(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [value.strip() for value in raw.split(",") if value.strip()]


def _parse_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default

    value = raw.strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    return default


class Settings:
    """Centralized startup settings."""

    default_cors_origins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://movil-dev.vercel.app",
        "https://movil-dev.onrender.com",
        "https://movil-dev-k8ux.vercel.app",
    ]

    configured_cors_origins = _parse_csv_env("CORS_ALLOW_ORIGINS")
    cors_origins = list(dict.fromkeys(configured_cors_origins + default_cors_origins))

    cors_origin_regex = (
        os.getenv("CORS_ALLOW_ORIGIN_REGEX", "").strip() or r"https://.*\.vercel\.app"
    )

    # Kept enabled by default to preserve current behavior.
    auto_apply_schema_changes = _parse_bool_env(
        "AUTO_APPLY_SCHEMA_CHANGES", True
    )
