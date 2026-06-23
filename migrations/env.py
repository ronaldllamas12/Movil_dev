import logging
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# ---------------------------------------------------------------------------
# Path setup — make sure both the project root and backend/ are importable
# so that `database.core.database` and the model packages resolve correctly.
# ---------------------------------------------------------------------------
_MIGRATIONS_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _MIGRATIONS_DIR.parent
_BACKEND_DIR = _PROJECT_ROOT / "backend"

for _p in (_PROJECT_ROOT, _BACKEND_DIR):
    _s = str(_p)
    if _s not in sys.path:
        sys.path.insert(0, _s)

# Import all models so that their tables are registered on Base.metadata
# before Alembic inspects it for autogenerate.
import auth.models  # noqa: F401  (RevokedToken, PasswordResetToken)
import cart.models  # noqa: F401  (CartItem, CartSettings)
import products.models  # noqa: F401  (Product)
import users.models  # noqa: F401  (User)

from database.core.database import Base  # noqa: E402

# ---------------------------------------------------------------------------
# Alembic Config object — provides access to values in alembic.ini.
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

logger = logging.getLogger("alembic.env")

# ---------------------------------------------------------------------------
# Inject DATABASE_URL from the environment so Railway (and local .env) work
# without hard-coding credentials in alembic.ini.
# ---------------------------------------------------------------------------
_raw_url = os.environ.get("DATABASE_URL", "")
if not _raw_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Define it in your .env file or Railway service variables."
    )
# Alembic/psycopg2 expects postgresql://, but psycopg3 needs postgresql+psycopg://.
# Normalise to the plain dialect so either driver can be configured via alembic.ini.
_db_url = _raw_url.replace("postgresql+psycopg://", "postgresql://", 1)
config.set_main_option("sqlalchemy.url", _db_url)

# ---------------------------------------------------------------------------
# Target metadata — used by `alembic revision --autogenerate`.
# ---------------------------------------------------------------------------
target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Migration runners
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL (no live DB connection needed).
    Emits SQL to stdout / a file rather than executing it directly.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the Alembic context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
