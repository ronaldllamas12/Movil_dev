"""Script para probar el endpoint de registro."""

import requests
import json

# URL del endpoint
BASE_URL = "http://localhost:8000"
REGISTER_URL = f"{BASE_URL}/auth/register"

# Datos de prueba
test_cases = [
    {
        "name": "Registro correcto",
        "data": {
            "email": "usuario@example.com",
            "password": "password123",
            "full_name": "Juan Pérez",
            "role": "usuario"
        }
    },
    {
        "name": "Sin full_name",
        "data": {
            "email": "usuario2@example.com",
            "password": "password123",
            "role": "usuario"
        }
    },
    {
        "name": "Contraseña muy corta",
        "data": {
            "email": "usuario3@example.com",
            "password": "123",
            "full_name": "Juan Pérez",
            "role": "usuario"
        }
    },
    {
        "name": "Email inválido",
        "data": {
            "email": "no-es-un-email",
            "password": "password123",
            "full_name": "Juan Pérez",
            "role": "usuario"
        }
    },
    {
        "name": "full_name muy corto",
        "data": {
            "email": "usuario4@example.com",
            "password": "password123",
            "full_name": "A",
            "role": "usuario"
        }
    }
]

print("Pruebando el endpoint de registro...\n")
print("=" * 80)

for test in test_cases:
    print(f"\n📋 {test['name']}")
    print(f"Datos enviados: {json.dumps(test['data'], indent=2)}")
    print("-" * 80)
    
    try:
        response = requests.post(REGISTER_URL, json=test['data'])
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print()

print("=" * 80)
print("\n✅ Validaciones requeridas:")
print("- email: Debe ser un email válido (ej: usuario@example.com)")
print("- password: Mínimo 8 caracteres")
print("- full_name: Mínimo 2 caracteres, máximo 200")
print("- role: Debe ser 'usuario' (por defecto) para registro público")
