"""order state machine and refunds audit

Revision ID: 20260430_order_state_refunds
Revises: 20260430_expand_scope
Create Date: 2026-04-30 14:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260430_order_state_refunds"
down_revision = "20260430_expand_scope"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS order_status_history (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id),
            from_status VARCHAR(32),
            to_status VARCHAR(32) NOT NULL,
            reason VARCHAR(300),
            actor_user_id INTEGER REFERENCES users(id),
            changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_order_status_history_order_id ON order_status_history (order_id)"
    ))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS order_refunds (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id),
            amount NUMERIC(10,2) NOT NULL,
            refund_type VARCHAR(16) NOT NULL,
            reason VARCHAR(300),
            actor_user_id INTEGER REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_order_refunds_order_id ON order_refunds (order_id)"
    ))


def downgrade() -> None:
    op.drop_index("ix_order_refunds_order_id", table_name="order_refunds")
    op.drop_table("order_refunds")

    op.drop_index("ix_order_status_history_order_id", table_name="order_status_history")
    op.drop_table("order_status_history")
