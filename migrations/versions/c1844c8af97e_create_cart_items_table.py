"""create all tables (initial schema)

Revision ID: c1844c8af97e
Revises: 
Create Date: 2026-04-17 21:11:16.671744


"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c1844c8af97e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('auth_provider', sa.String(length=20), nullable=False),
        sa.Column('google_sub', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('purchase_history', sa.JSON(), nullable=False),
        sa.Column('preferences', sa.JSON(), nullable=False),
        sa.Column('saved_articles', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('users_pkey')),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_google_sub'), 'users', ['google_sub'], unique=True)

    # ------------------------------------------------------------------
    # products
    # ------------------------------------------------------------------
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('marca', sa.String(length=100), nullable=False),
        sa.Column('referencia', sa.String(length=100), nullable=False),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.Column('categoria', sa.String(length=20), nullable=False),
        sa.Column('descripcion_breve', sa.String(length=500), nullable=False),
        sa.Column('cantidad_stock', sa.Integer(), nullable=False),
        sa.Column('precio_unitario', sa.Numeric(10, 2), nullable=False),
        sa.Column('tamano_memoria_ram', sa.String(length=50), nullable=False),
        sa.Column('rom', sa.String(length=50), nullable=False),
        sa.Column('colores_disponibles', sa.JSON(), nullable=False),
        sa.Column('conectividad', sa.String(length=120), nullable=False),
        sa.Column('procesador', sa.String(length=120), nullable=False),
        sa.Column('dimensiones', sa.String(length=120), nullable=False),
        sa.Column('bateria', sa.String(length=120), nullable=False),
        sa.Column('resolucion_camara_principal', sa.String(length=80), nullable=False),
        sa.Column('resolucion_camara_frontal', sa.String(length=80), nullable=False),
        sa.Column('capacidad_carga_rapida', sa.String(length=40), nullable=False),
        sa.Column('garantia_meses', sa.Integer(), nullable=False),
        sa.Column('imagen_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint(
            "categoria IN ('premium', 'gama media', 'economico')",
            name='ck_products_categoria',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('products_pkey')),
    )
    op.create_index(op.f('ix_products_marca'), 'products', ['marca'], unique=False)
    op.create_index(op.f('ix_products_referencia'), 'products', ['referencia'], unique=True)
    op.create_index(op.f('ix_products_nombre'), 'products', ['nombre'], unique=False)
    op.create_index(op.f('ix_products_categoria'), 'products', ['categoria'], unique=False)

    # ------------------------------------------------------------------
    # cart_items
    # ------------------------------------------------------------------
    op.create_table(
        'cart_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('cart_items_pkey')),
        sa.UniqueConstraint('user_id', 'product_id', name='uq_cart_items_user_product'),
    )
    op.create_index(op.f('ix_cart_items_user_id'), 'cart_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)

    # ------------------------------------------------------------------
    # cart_settings
    # ------------------------------------------------------------------
    op.create_table(
        'cart_settings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('tax_percent', sa.Numeric(5, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('cart_settings_pkey')),
    )

    # ------------------------------------------------------------------
    # revoked_tokens
    # ------------------------------------------------------------------
    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('jti', sa.String(length=64), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('revoked_tokens_pkey')),
    )
    op.create_index(op.f('ix_revoked_tokens_jti'), 'revoked_tokens', ['jti'], unique=True)

    # ------------------------------------------------------------------
    # password_reset_tokens
    # ------------------------------------------------------------------
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('password_reset_tokens_pkey')),
    )
    op.create_index(op.f('ix_password_reset_tokens_user_id'), 'password_reset_tokens', ['user_id'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_token'), 'password_reset_tokens', ['token'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_password_reset_tokens_token'), table_name='password_reset_tokens')
    op.drop_index(op.f('ix_password_reset_tokens_user_id'), table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')

    op.drop_index(op.f('ix_revoked_tokens_jti'), table_name='revoked_tokens')
    op.drop_table('revoked_tokens')

    op.drop_table('cart_settings')

    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_user_id'), table_name='cart_items')
    op.drop_table('cart_items')

    op.drop_index(op.f('ix_products_categoria'), table_name='products')
    op.drop_index(op.f('ix_products_nombre'), table_name='products')
    op.drop_index(op.f('ix_products_referencia'), table_name='products')
    op.drop_index(op.f('ix_products_marca'), table_name='products')
    op.drop_table('products')

    op.drop_index(op.f('ix_users_google_sub'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
