"""Aplicación Flask mínima para ejecutar migraciones con Flask-Migrate.

Uso:
1) pip install -r requirements.txt
2) flask --app backend.flask_migrate_app db init
3) flask --app backend.flask_migrate_app db migrate -m "create cart_items"
4) flask --app backend.flask_migrate_app db upgrade
"""

import os
import sys
from pathlib import Path

from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Asegura imports de paquetes del proyecto al ejecutar `flask --app ...`
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Importa modelos para que SQLAlchemy conozca metadata completa.
from cart.models import CartItem  # noqa: F401
from products.models import Product  # noqa: F401
from users.models import User  # noqa: F401

from database.core.database import Base


def _database_uri() -> str:
    raw_url = os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError(
            "DATABASE_URL no está configurada. Define la conexión en tu .env"
        )
    return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = _database_uri()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Reutiliza la misma Base declarativa usada por FastAPI.
db = SQLAlchemy(app, model_class=Base)
migrate = Migrate(app, db)
