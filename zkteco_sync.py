#!/usr/bin/env python3
"""
Sincronizador ZKTeco K20 Pro → Cetox ERP
Uso:  python3 zkteco_sync.py
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ── Configuración ─────────────────────────────────────────────────────────────

ZK_IP      = "192.168.1.201"   # IP del huellero (ver en Menú → Comm → Ethernet)
ZK_PORT    = 4370
ZK_TIMEOUT = 10

# URL del ERP (cambiar a https://cetoxlab.tech para producción)
ERP_URL    = "http://localhost:3010/api/asistencia/sync"
API_KEY    = "cetox-zk-sync-2026"   # debe coincidir con ZK_SYNC_API_KEY en el .env

# ─────────────────────────────────────────────────────────────────────────────


def conectar_y_descargar():
    try:
        from zk import ZK
    except ImportError:
        print("ERROR: librería pyzk no encontrada.")
        print("       Instala con:  pip3 install pyzk")
        sys.exit(1)

    print(f"Conectando a huellero {ZK_IP}:{ZK_PORT} ...")
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=ZK_TIMEOUT)
    conn = None

    try:
        conn = zk.connect()
        conn.disable_device()
        print("  Conexión establecida.")

        # Usuarios del huellero (para obtener nombres)
        usuarios = {u.user_id: u.name for u in conn.get_users()}
        print(f"  Usuarios en huellero: {len(usuarios)}")

        # Registros de asistencia
        asistencias = conn.get_attendance()
        print(f"  Marcaciones descargadas: {len(asistencias)}")

        registros = []
        for a in asistencias:
            nombre = usuarios.get(a.user_id, f"ID-{a.user_id}")
            # Convertir a ISO 8601 UTC asumiendo que el huellero está en hora local Lima
            ts = a.timestamp
            if ts.tzinfo is None:
                import pytz
                try:
                    lima = pytz.timezone("America/Lima")
                    ts = lima.localize(ts).astimezone(timezone.utc)
                except ImportError:
                    # Sin pytz — asumimos que el huellero ya está en UTC
                    ts = ts.replace(tzinfo=timezone.utc)
            registros.append({
                "user_id":   str(a.user_id),
                "nombre":    nombre,
                "timestamp": ts.isoformat(),
                "tipo":      a.punch,
            })

        return registros

    finally:
        if conn:
            conn.enable_device()
            conn.disconnect()


def enviar_al_erp(registros: list) -> dict:
    print(f"\nEnviando {len(registros)} registros al ERP ...")
    body = json.dumps(registros).encode("utf-8")
    req  = urllib.request.Request(
        ERP_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-api-key":    API_KEY,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"ERROR HTTP {e.code}: {e.read().decode()}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"ERROR de conexión al ERP: {e.reason}")
        print("  ¿Está corriendo el servidor? (npm run dev)")
        sys.exit(1)


def main():
    registros = conectar_y_descargar()

    if not registros:
        print("No hay marcaciones en el huellero.")
        return

    resultado = enviar_al_erp(registros)
    print(f"\n  Total enviados : {resultado.get('total', '?')}")
    print(f"  Insertados     : {resultado.get('insertados', '?')}")
    print(f"  Vinculados     : {resultado.get('vinculados', '?')}")
    print("\nSync completado.")


if __name__ == "__main__":
    main()
