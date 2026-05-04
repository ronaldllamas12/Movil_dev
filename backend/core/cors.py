"""CORS helpers to keep HTTP bootstrap isolated from main app module."""

from __future__ import annotations

import re

from fastapi import Request, Response

from core.settings import Settings


def origin_is_allowed(origin: str | None) -> bool:
    """Return True if the request origin is explicitly allowed."""
    if not origin:
        return False

    if origin in Settings.cors_origins:
        return True

    if not Settings.cors_origin_regex:
        return False

    return re.fullmatch(Settings.cors_origin_regex, origin) is not None


def apply_cors_headers(response: Response, origin: str | None) -> Response:
    """Attach CORS headers for allowed origins only."""
    if not origin_is_allowed(origin):
        return response

    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,Accept,Origin,X-Requested-With"
    response.headers["Vary"] = "Origin"
    return response


async def ensure_cors_headers_middleware(request: Request, call_next):
    """Return CORS-compliant responses for both preflight and regular calls."""
    origin = request.headers.get("origin")

    if request.method == "OPTIONS":
        return apply_cors_headers(Response(status_code=204), origin)

    response = await call_next(request)
    return apply_cors_headers(response, origin)
