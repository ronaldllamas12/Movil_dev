"""add product color variants

Revision ID: 20260503_product_color_variants
Revises: 20260430_order_state_refunds
Create Date: 2026-05-03 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260503_product_color_variants"
down_revision = "20260430_order_state_refunds"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS color_variants JSONB NOT NULL DEFAULT '[]'::jsonb"
    ))


def downgrade() -> None:
    op.get_bind().execute(sa.text("ALTER TABLE products DROP COLUMN IF EXISTS color_variants"))
