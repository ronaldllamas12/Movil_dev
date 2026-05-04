"""expand order cart product scope

Revision ID: 20260430_expand_scope
Revises: 20240424_add_discount_percent_to_product
Create Date: 2026-04-30 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260430_expand_scope"
down_revision = "20240424_add_discount_percent_to_product"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # orders: cancel metadata (idempotent)
    conn.execute(sa.text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ"))
    conn.execute(sa.text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(300)"))

    # cart_items: anonymous cart support (idempotent)
    conn.execute(sa.text("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS session_id VARCHAR(128)"))
    conn.execute(sa.text("ALTER TABLE cart_items ALTER COLUMN user_id DROP NOT NULL"))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_cart_items_session_id ON cart_items (session_id)"
    ))
    conn.execute(sa.text(
        "DO $$ BEGIN "
        "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_cart_items_session_product') THEN "
        "ALTER TABLE cart_items ADD CONSTRAINT uq_cart_items_session_product UNIQUE (session_id, product_id); "
        "END IF; END $$"
    ))

    # products: common search index (idempotent)
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_products_search ON products (marca, categoria, is_active)"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_products_search"))
    conn.execute(sa.text(
        "ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS uq_cart_items_session_product"
    ))
    conn.execute(sa.text("DROP INDEX IF EXISTS ix_cart_items_session_id"))
    conn.execute(sa.text("ALTER TABLE cart_items DROP COLUMN IF EXISTS session_id"))
    conn.execute(sa.text("ALTER TABLE orders DROP COLUMN IF EXISTS cancellation_reason"))
    conn.execute(sa.text("ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at"))
