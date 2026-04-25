"""Add discount_percent to Product model for per-product discounts."""
import sqlalchemy as sa
from alembic import op


def upgrade():
    # This migration is now a no-op because discount_percent has been fully removed.
    pass


def downgrade():
    # No-op: column already removed.
    pass
