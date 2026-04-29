"""Script de diagnóstico para verificar órdenes en la base de datos."""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Agregar el directorio backend al path
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Cargar variables de entorno
PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Importar modelos
from users.models import User
from orders.models import Order, OrderItem
from cart.models import CartItem

# Obtener URL de BD
raw_url = os.getenv("DATABASE_URL")
if not raw_url:
    raise RuntimeError("DATABASE_URL no está configurada en .env")

# Railway proporciona postgresql:// pero psycopg3 requiere postgresql+psycopg://
database_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)

print("=" * 80)
print("🔍 DIAGNÓSTICO DE ÓRDENES EN LA BASE DE DATOS")
print("=" * 80)

# Crear conexión
engine = create_engine(database_url)
Session = sessionmaker(bind=engine)
db = Session()

try:
    # 1. Contar usuarios
    print("\n📊 USUARIOS EN LA APLICACIÓN:")
    print("-" * 80)
    users = db.query(User).all()
    print(f"Total de usuarios: {len(users)}\n")
    
    for user in users:
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Nombre: {user.full_name}")
        print(f"  Rol: {user.role}")
        print(f"  Activo: {user.is_active}")
        print()

    # 2. Contar órdenes
    print("\n📦 ÓRDENES EN LA APLICACIÓN:")
    print("-" * 80)
    orders = db.query(Order).all()
    print(f"Total de órdenes: {len(orders)}\n")
    
    if orders:
        for order in orders:
            user = db.query(User).filter(User.id == order.user_id).first()
            print(f"  ID Orden: {order.id}")
            print(f"  Usuario: {user.email if user else 'Desconocido'} (ID: {order.user_id})")
            print(f"  Fecha: {order.created_at}")
            print(f"  Estado: {order.status}")
            print(f"  Subtotal: ${order.subtotal}")
            print(f"  Impuestos: ${order.tax}")
            print(f"  Total: ${order.total}")
            
            # Items de la orden
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            print(f"  Items: {len(items)}")
            for item in items:
                print(f"    - Producto ID: {item.product_id}, Cantidad: {item.quantity}, Precio: ${item.price}")
            print()
    else:
        print("  ⚠️  No hay órdenes registradas en la base de datos")
        print()

    # 3. Verificar carritos
    print("\n🛒 CARRITOS ACTIVOS:")
    print("-" * 80)
    cart_items = db.query(CartItem).all()
    print(f"Total de items en carritos: {len(cart_items)}\n")
    
    if cart_items:
        for item in cart_items:
            user = db.query(User).filter(User.id == item.user_id).first()
            print(f"  Usuario: {user.email if user else 'Desconocido'} (ID: {item.user_id})")
            print(f"  Producto ID: {item.product_id}")
            print(f"  Cantidad: {item.quantity}")
            print(f"  Precio: ${item.price}")
            print()
    else:
        print("  ✅ No hay items en carritos (correcto después de hacer pedidos)")
        print()

    # 4. Información sobre roles de administrador
    print("\n👑 ADMINISTRADORES:")
    print("-" * 80)
    admins = db.query(User).filter(User.role == "administrador").all()
    print(f"Total de administradores: {len(admins)}\n")
    
    if admins:
        for admin in admins:
            print(f"  Email: {admin.email}")
            print(f"  Nombre: {admin.full_name}")
            print(f"  Activo: {admin.is_active}")
            print()
    else:
        print("  ⚠️  No hay administradores configurados")
        print("  Para crear uno, actualiza el rol de un usuario:")
        print("  UPDATE users SET role = 'administrador' WHERE email = 'tu@email.com';")
        print()

    # 5. Query SQL directa para verificar tablas
    print("\n🗄️  INFORMACIÓN DE TABLAS:")
    print("-" * 80)
    
    with engine.connect() as conn:
        # Órdenes
        result = conn.execute(text("SELECT COUNT(*) as count FROM orders"))
        orders_count = result.scalar()
        print(f"Órdenes en DB (query directo): {orders_count}")
        
        # Items de órdenes
        result = conn.execute(text("SELECT COUNT(*) as count FROM order_items"))
        order_items_count = result.scalar()
        print(f"Items de órdenes en DB: {order_items_count}")
        
        # Usuarios
        result = conn.execute(text("SELECT COUNT(*) as count FROM users"))
        users_count = result.scalar()
        print(f"Usuarios en DB: {users_count}")
        
        # Items en carrito
        result = conn.execute(text("SELECT COUNT(*) as count FROM cart_items"))
        cart_count = result.scalar()
        print(f"Items en carrito en DB: {cart_count}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

finally:
    db.close()
    print("\n" + "=" * 80)
    print("✅ Diagnóstico completado")
    print("=" * 80)
