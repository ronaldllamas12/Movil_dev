"""Unit tests for CORS helper behavior."""

import pytest
from fastapi import Response
from starlette.requests import Request

from core import cors
from core.settings import Settings


def _build_request(method: str, origin: str | None = None) -> Request:
    headers = []
    if origin is not None:
        headers.append((b"origin", origin.encode("utf-8")))

    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "headers": headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    }
    return Request(scope)


def test_origin_is_allowed_supports_exact_and_regex(monkeypatch):
    monkeypatch.setattr(Settings, "cors_origins", ["http://localhost:5173"])
    monkeypatch.setattr(Settings, "cors_origin_regex", r"https://.*\.vercel\.app")

    assert cors.origin_is_allowed("http://localhost:5173") is True
    assert cors.origin_is_allowed("https://movil-dev.vercel.app") is True
    assert cors.origin_is_allowed("http://evil.local") is False
    assert cors.origin_is_allowed(None) is False


def test_apply_cors_headers_only_for_allowed_origin(monkeypatch):
    monkeypatch.setattr(Settings, "cors_origins", ["http://localhost:5173"])
    monkeypatch.setattr(Settings, "cors_origin_regex", "")

    allowed = cors.apply_cors_headers(Response(status_code=200), "http://localhost:5173")
    denied = cors.apply_cors_headers(Response(status_code=200), "http://evil.local")

    assert allowed.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert "Access-Control-Allow-Origin" not in denied.headers


@pytest.mark.asyncio
async def test_ensure_cors_headers_middleware_handles_options(monkeypatch):
    monkeypatch.setattr(Settings, "cors_origins", ["http://localhost:5173"])
    monkeypatch.setattr(Settings, "cors_origin_regex", "")

    request = _build_request("OPTIONS", "http://localhost:5173")

    async def _call_next(_request):  # pragma: no cover
        return Response(status_code=500)

    response = await cors.ensure_cors_headers_middleware(request, _call_next)

    assert response.status_code == 204
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"


@pytest.mark.asyncio
async def test_ensure_cors_headers_middleware_passes_through_non_options(monkeypatch):
    monkeypatch.setattr(Settings, "cors_origins", ["http://localhost:5173"])
    monkeypatch.setattr(Settings, "cors_origin_regex", "")

    request = _build_request("GET", "http://localhost:5173")

    async def _call_next(_request):
        return Response(status_code=200)

    response = await cors.ensure_cors_headers_middleware(request, _call_next)

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
