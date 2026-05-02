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
    op.create_table(
        "order_status_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("from_status", sa.String(length=32), nullable=True),
        sa.Column("to_status", sa.String(length=32), nullable=False),
        sa.Column("reason", sa.String(length=300), nullable=True),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_status_history_order_id", "order_status_history", ["order_id"], unique=False)

    op.create_table(
        "order_refunds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("refund_type", sa.String(length=16), nullable=False),
        sa.Column("reason", sa.String(length=300), nullable=True),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_refunds_order_id", "order_refunds", ["order_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_order_refunds_order_id", table_name="order_refunds")
    op.drop_table("order_refunds")

    op.drop_index("ix_order_status_history_order_id", table_name="order_status_history")
    op.drop_table("order_status_history")
