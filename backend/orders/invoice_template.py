"""Generación de PDF para facturas de pedidos.

Este módulo se ocupa exclusivamente de la representación gráfica de la factura.
Las responsabilidades de resolución de rutas y envío de email están en módulos separados:
  - path_utils.py  → get_invoices_dir(), resolve_invoice_pdf_path()
  - email_service.py → send_invoice_email()
"""

from __future__ import annotations

# Re-exports para compatibilidad con código existente
from orders.path_utils import get_invoices_dir, resolve_invoice_pdf_path  # noqa: F401
from orders.email_service import send_invoice_email  # noqa: F401


# ---------------------------------------------------------------------------
# Generación de PDF
# ---------------------------------------------------------------------------

def generate_invoice_pdf(db, order):
    """Arma el PDF de la factura a partir de los datos de la orden."""
    invoice = order.to_invoice_dict() if hasattr(order, 'to_invoice_dict') else {}
    import qrcode
    from io import BytesIO
    qr_buffer = BytesIO()
    qr_data = f"Factura {order.id} - {getattr(order, 'customer_name', '')}"
    qr = qrcode.make(qr_data)
    qr.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    invoices_dir = get_invoices_dir()
    pdf_path = invoices_dir / f"invoice_{order.id}.pdf"
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    render_invoice_pdf(pdf_path=pdf_path, invoice=invoice, qr_buffer=qr_buffer)
    return pdf_path


# ---------------------------------------------------------------------------
# Renderizado ReportLab
# ---------------------------------------------------------------------------

from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


PAGE_WIDTH, _ = letter
INNER_WIDTH = PAGE_WIDTH - 36 - 36
PRIMARY = colors.HexColor("#111827")
MUTED = colors.HexColor("#64748B")
BORDER = colors.HexColor("#CBD5E1")
HEADER_BG = colors.HexColor("#F1F5F9")
ACCENT = colors.HexColor("#0F766E")


def _paragraph(value: Any, style: ParagraphStyle) -> Paragraph:
    return Paragraph(str(value or ""), style)


def _money(value: Any) -> str:
    return f"${float(value or 0):,.2f}"


def _section_title(text: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table([[Paragraph(text, styles["section"])]], colWidths=[INNER_WIDTH])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HEADER_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _info_box(title: str, rows: list[tuple[str, Any]], width: float, styles: dict[str, ParagraphStyle]) -> Table:
    data = [[Paragraph(title, styles["box_title"])]]
    for label, value in rows:
        data.append(
            [
                Paragraph(
                    f"<b>{label}</b><br/>{value or 'No aplica'}",
                    styles["small"],
                )
            ]
        )

    table = Table(data, colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("INNERGRID", (0, 1), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def _build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "InvoiceTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=PRIMARY,
            alignment=TA_RIGHT,
            spaceAfter=3,
        ),
        "subtitle": ParagraphStyle(
            "InvoiceSubtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=MUTED,
            alignment=TA_RIGHT,
        ),
        "brand": ParagraphStyle(
            "InvoiceBrand",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            textColor=ACCENT,
            spaceAfter=2,
        ),
        "small": ParagraphStyle(
            "InvoiceSmall",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.6,
            leading=9.5,
            textColor=PRIMARY,
        ),
        "tiny": ParagraphStyle(
            "InvoiceTiny",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=6.8,
            leading=8,
            textColor=MUTED,
        ),
        "section": ParagraphStyle(
            "InvoiceSection",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            textColor=PRIMARY,
        ),
        "box_title": ParagraphStyle(
            "InvoiceBoxTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=PRIMARY,
        ),
        "total_label": ParagraphStyle(
            "InvoiceTotalLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=PRIMARY,
        ),
        "total_value": ParagraphStyle(
            "InvoiceTotalValue",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=13,
            textColor=ACCENT,
            alignment=TA_RIGHT,
        ),
    }


def render_invoice_pdf(
    *,
    pdf_path: Path,
    invoice: dict[str, Any],
    qr_buffer: BytesIO,
) -> Path:
    styles = _build_styles()
    story: list[Any] = []

    issuer = invoice["issuer"]
    buyer = invoice["buyer"]
    numbering = invoice["numbering"]
    tax_quality = invoice["tax_quality"]
    tech_provider = invoice["tech_provider"]
    totals = invoice["totals"]

    header_left = [
        Paragraph(issuer["name"], styles["brand"]),
        Paragraph(f"NIT: {issuer['nit']}", styles["small"]),
        Paragraph(f"Documento: {invoice['document_name']}", styles["small"]),
        Paragraph(f"Software: {tech_provider['software_name']}", styles["tiny"]),
    ]
    header_right = [
        Paragraph(invoice["document_name"], styles["title"]),
        Paragraph(f"<b>No.</b> {invoice['invoice_number']}", styles["subtitle"]),
        Paragraph(f"<b>Fecha:</b> {invoice['issued_at']}", styles["subtitle"]),
        Paragraph(f"<b>Forma de pago:</b> {invoice['payment']['form']}", styles["subtitle"]),
        Paragraph(f"<b>Medio:</b> {invoice['payment']['method']}", styles["subtitle"]),
    ]
    header = Table([[header_left, header_right]], colWidths=[INNER_WIDTH * 0.52, INNER_WIDTH * 0.48])
    header.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.7, PRIMARY),
                ("LINEBELOW", (0, 0), (-1, -1), 2, ACCENT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(header)
    story.append(Spacer(1, 5 * mm))

    issuer_box = _info_box(
        "Emisor",
        [
            ("Apellidos y nombres o razon social", issuer["name"]),
            ("NIT vendedor/prestador", issuer["nit"]),
            ("Calidad tributaria", tax_quality),
        ],
        INNER_WIDTH / 2 - 4,
        styles,
    )
    buyer_box = _info_box(
        "Adquirente",
        [
            ("Apellidos y nombres o razon social", buyer["name"]),
            ("NIT comprador", buyer["nit"]),
            ("Correo", buyer["email"]),
            ("Direccion de entrega", buyer["delivery_address"]),
        ],
        INNER_WIDTH / 2 - 4,
        styles,
    )
    parties = Table([[issuer_box, buyer_box]], colWidths=[INNER_WIDTH / 2, INNER_WIDTH / 2])
    parties.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(parties)
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title("Detalle de la Compra", styles))
    item_rows = [
        ["Item", "Cant.", "Unidad", "Descripcion", "Codigo", "Vr. unitario", "Impuestos", "Total"],
    ]
    for item in invoice["items"]:
        item_rows.append(
            [
                item["line"],
                item["quantity"],
                item["unit"],
                _paragraph(item["description"], styles["small"]),
                item["code"],
                _money(item["unit_price"]),
                item["taxes"],
                _money(item["line_total"]),
            ]
        )

    items_table = Table(
        item_rows,
        repeatRows=1,
        colWidths=[24, 30, 39, 150, 58, 62, 54, 67],
    )
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 1), (2, -1), "CENTER"),
                ("ALIGN", (5, 1), (-1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 4 * mm))

    qr = Image(qr_buffer, width=34 * mm, height=34 * mm)
    qr_box = Table(
        [
            [Paragraph("Codigo QR DIAN", styles["box_title"])],
            [qr],
            [Paragraph(f"CUFE: {invoice['cufe']}", styles["tiny"])],
        ],
        colWidths=[INNER_WIDTH * 0.44],
    )
    qr_box.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("ALIGN", (0, 1), (0, 1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    totals_table = Table(
        [
            ["Subtotal", _money(totals["subtotal"])],
            ["IVA", _money(totals["iva"])],
            ["Imp. Nacional al Consumo", _money(totals["consumption_tax"])],
            ["Imp. Bolsas Plasticas", _money(totals["plastic_bag_tax"])],
            ["Total lineas/items", str(totals["line_count"])],
            [Paragraph("TOTAL A PAGAR", styles["total_label"]), Paragraph(_money(totals["total"]), styles["total_value"])],
        ],
        colWidths=[INNER_WIDTH * 0.28, INNER_WIDTH * 0.28],
    )
    totals_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.7, PRIMARY),
                ("GRID", (0, 0), (-1, -2), 0.35, BORDER),
                ("BACKGROUND", (0, -1), (-1, -1), HEADER_BG),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    summary = Table([[qr_box, totals_table]], colWidths=[INNER_WIDTH * 0.44, INNER_WIDTH * 0.56])
    summary.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(summary)
    story.append(Spacer(1, 5 * mm))

    story.append(_section_title("Numeracion DIAN y proveedor tecnologico", styles))
    footer_table = Table(
        [
            [
                Paragraph(
                    f"<b>Rango autorizado:</b> {numbering['authorized_range']}<br/>"
                    f"<b>Fecha y vigencia:</b> {numbering['validity']}<br/>"
                    f"<b>Proveedor tecnologico:</b> {tech_provider['name']} - NIT {tech_provider['nit']}<br/>"
                    f"<b>Software de facturacion:</b> {tech_provider['software_name']}",
                    styles["small"],
                )
            ]
        ],
        colWidths=[INNER_WIDTH],
    )
    footer_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(footer_table)
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Representacion grafica generada por Movil Dev.", styles["tiny"]))

    print(f"[DEBUG] Generando PDF en: {pdf_path}")
    print(f"[DEBUG] Cantidad de elementos en story: {len(story)}")
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=28,
        bottomMargin=28,
        title=invoice["document_name"],
    )
    doc.build(story)
    print(f"[DEBUG] PDF generado correctamente: {pdf_path}")
    return pdf_path


# ---------------------------------------------------------------------------
# Implementación concreta de InvoiceGenerator (DIP — Task 9)
# ---------------------------------------------------------------------------

from orders.interfaces import InvoiceGenerator  # noqa: E402
from sqlalchemy.orm import Session as _Session  # noqa: E402


class ReportLabInvoiceGenerator(InvoiceGenerator):
    """Implementación de InvoiceGenerator usando ReportLab."""

    def generate(self, db: _Session, order) -> Path:
        return generate_invoice_pdf(db, order)
