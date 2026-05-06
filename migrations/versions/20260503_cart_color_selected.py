"""add color selected to cart and order items

Revision ID: 20260503_cart_color_selected
Revises: 20260503_product_color_variants
Create Date: 2026-05-03 13:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260503_cart_color_selected"
down_revision = "20260503_product_color_variants"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # cart_items.color_selected (idempotent)
    conn.execute(sa.text(
        "ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS color_selected VARCHAR(50) NOT NULL DEFAULT ''"
    ))

    # Drop old unique constraints if they still exist (idempotent via DO block)
    conn.execute(sa.text(
        "DO $$ BEGIN "
        "IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_cart_items_user_product') THEN "
        "ALTER TABLE cart_items DROP CONSTRAINT uq_cart_items_user_product; "
        "END IF; END $$"
    ))
    conn.execute(sa.text(
        "DO $$ BEGIN "
        "IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_cart_items_session_product') THEN "
        "ALTER TABLE cart_items DROP CONSTRAINT uq_cart_items_session_product; "
        "END IF; END $$"
    ))

    # New unique constraints with color (idempotent)
    conn.execute(sa.text(
        "DO $$ BEGIN "
        "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_cart_items_user_product_color') THEN "
        "ALTER TABLE cart_items ADD CONSTRAINT uq_cart_items_user_product_color UNIQUE (user_id, product_id, color_selected); "
        "END IF; END $$"
    ))
    conn.execute(sa.text(
        "DO $$ BEGIN "
        "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_cart_items_session_product_color') THEN "
        "ALTER TABLE cart_items ADD CONSTRAINT uq_cart_items_session_product_color UNIQUE (session_id, product_id, color_selected); "
        "END IF; END $$"
    ))

    # order_items.color_selected (idempotent)
    conn.execute(sa.text(
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color_selected VARCHAR(50)"
    ))


def downgrade() -> None:
    op.drop_column("order_items", "color_selected")

    op.drop_constraint("uq_cart_items_session_product_color", "cart_items", type_="unique")
    op.drop_constraint("uq_cart_items_user_product_color", "cart_items", type_="unique")

    op.create_unique_constraint(
        "uq_cart_items_session_product",
        "cart_items",
        ["session_id", "product_id"],
    )
    op.create_unique_constraint(
        "uq_cart_items_user_product",
        "cart_items",
        ["user_id", "product_id"],
    )

    op.drop_column("cart_items", "color_selected")
