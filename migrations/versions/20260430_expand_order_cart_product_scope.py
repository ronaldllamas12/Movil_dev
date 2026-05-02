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
    # orders: cancel metadata
    op.add_column("orders", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("cancellation_reason", sa.String(length=300), nullable=True))

    # cart_items: anonymous cart support
    op.add_column("cart_items", sa.Column("session_id", sa.String(length=128), nullable=True))
    op.alter_column("cart_items", "user_id", existing_type=sa.Integer(), nullable=True)
    op.create_index("ix_cart_items_session_id", "cart_items", ["session_id"], unique=False)
    op.create_unique_constraint("uq_cart_items_session_product", "cart_items", ["session_id", "product_id"])

    # products: common search index
    op.create_index("ix_products_search", "products", ["marca", "categoria", "is_active"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_products_search", table_name="products")

    op.drop_constraint("uq_cart_items_session_product", "cart_items", type_="unique")
    op.drop_index("ix_cart_items_session_id", table_name="cart_items")
    op.alter_column("cart_items", "user_id", existing_type=sa.Integer(), nullable=False)
    op.drop_column("cart_items", "session_id")

    op.drop_column("orders", "cancellation_reason")
    op.drop_column("orders", "cancelled_at")
