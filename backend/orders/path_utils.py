"""Utilidades de rutas para facturas de ordenes."""

from __future__ import annotations

import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CANONICAL_INVOICES_DIR = PROJECT_ROOT / "generated" / "invoices"
LEGACY_INVOICE_DIRS = (
    PROJECT_ROOT / "invoices",
    PROJECT_ROOT / "backend" / "generated" / "invoices",
)


def get_invoices_dir() -> Path:
    """Garantiza y retorna el directorio canonico de facturas."""
    CANONICAL_INVOICES_DIR.mkdir(parents=True, exist_ok=True)
    return CANONICAL_INVOICES_DIR


def resolve_invoice_pdf_path(
    stored_path: str | Path | None,
    *,
    move_legacy_file: bool = True,
) -> Path | None:
    """Resuelve la ruta de una factura, migrando desde rutas legacy si aplica."""
    if not stored_path:
        return None

    invoices_dir = get_invoices_dir()
    raw_path = Path(stored_path)
    basename = raw_path.name
    if not basename:
        return None

    candidates: list[Path] = []
    if raw_path.is_absolute():
        candidates.append(raw_path)
    else:
        candidates.append(invoices_dir / basename)
        candidates.append(PROJECT_ROOT / raw_path)

    for legacy_dir in LEGACY_INVOICE_DIRS:
        candidates.append(legacy_dir / basename)

    for candidate in candidates:
        if not candidate.exists() or not candidate.is_file():
            continue

        if invoices_dir in candidate.parents:
            return candidate

        target = invoices_dir / candidate.name
        if move_legacy_file and target != candidate:
            if not target.exists():
                shutil.move(str(candidate), str(target))
            return target
        return candidate

    return invoices_dir / basename
