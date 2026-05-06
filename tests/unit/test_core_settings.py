"""Unit tests for environment settings helpers."""

from core.settings import _parse_bool_env, _parse_csv_env


def test_parse_csv_env_splits_and_trims(monkeypatch):
    monkeypatch.setenv("TEST_CSV_ENV", " http://a.com, ,http://b.com ,")

    values = _parse_csv_env("TEST_CSV_ENV")

    assert values == ["http://a.com", "http://b.com"]


def test_parse_bool_env_honors_true_false_and_default(monkeypatch):
    monkeypatch.setenv("FLAG_BOOL", "true")
    assert _parse_bool_env("FLAG_BOOL", False) is True

    monkeypatch.setenv("FLAG_BOOL", "0")
    assert _parse_bool_env("FLAG_BOOL", True) is False

    monkeypatch.setenv("FLAG_BOOL", "invalid")
    assert _parse_bool_env("FLAG_BOOL", True) is True

    monkeypatch.delenv("FLAG_BOOL", raising=False)
    assert _parse_bool_env("FLAG_BOOL", False) is False
