"""Basic performance tests for backend hot paths.

These tests use generous thresholds to detect major regressions, not micro-benchmarking.
"""

from time import perf_counter

from cart.schemas import CartItemResponse
from cart.services import compute_cart_totals
from payments.services import build_paypal_amount


def test_compute_cart_totals_large_input_under_threshold():
    items = [
        CartItemResponse(
            id=i,
            product_id=i,
            referencia=f"REF-{i}",
            nombre=f"Producto {i}",
            quantity=2,
            price=100000.0,
            line_total=200000.0,
        )
        for i in range(5000)
    ]

    started = perf_counter()
    totals = compute_cart_totals(items=items, tax_percent=19, shipping_fee=0)
    elapsed = perf_counter() - started

    assert totals.item_count == 10000
    assert elapsed < 0.35


def test_build_paypal_amount_batch_under_threshold(monkeypatch):
    monkeypatch.setenv("PAYPAL_CURRENCY", "USD")
    monkeypatch.setenv("PAYPAL_COP_TO_USD_RATE", "4000")

    started = perf_counter()
    for _ in range(10000):
        amount, currency = build_paypal_amount(1234567.0)
        assert currency == "USD"
        assert amount
    elapsed = perf_counter() - started

    assert elapsed < 1.2
