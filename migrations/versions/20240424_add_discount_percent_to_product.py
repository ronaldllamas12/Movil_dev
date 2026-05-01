"""Add discount_percent to Product model for per-product discounts.

Revision ID: 20240424_add_discount_percent_to_product
Revises: c1844c8af97e
Create Date: 2024-04-24 00:00:00.000000
"""

# revision identifiers, used by Alembic.
revision = "20240424_add_discount_percent_to_product"
down_revision = "c1844c8af97e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Historical no-op: this column was later removed from the model.
    pass


def downgrade() -> None:
    # Historical no-op.
    pass
