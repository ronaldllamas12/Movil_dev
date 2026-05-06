"""Interfaces para clientes de pasarelas de pago."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class PaymentProviderClient(ABC):
    @abstractmethod
    def get_access_token(self) -> str:
        ...

    @abstractmethod
    def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        ...

    @abstractmethod
    def capture_order(self, order_id: str) -> dict[str, Any]:
        ...
