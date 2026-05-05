"""Interfaces para el modulo de ordenes."""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from sqlalchemy.orm import Session


class InvoiceGenerator(ABC):
    """Contrato para generadores de facturas PDF."""

    @abstractmethod
    def generate(self, db: Session, order) -> Path:
        """Genera un PDF para la orden y retorna la ruta del archivo."""
        ...
