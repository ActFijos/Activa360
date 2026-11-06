import subprocess
import time
import json
import os
import sys
import statistics

def run_cmd(cmd):
    print(f"\n>> {cmd}", flush=True)
    t0 = time.perf_counter()
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    elapsed = time.perf_counter() - t0
    if res.returncode != 0:
        print(f"WARN / ERR ({res.returncode}): {res.stderr[:300]}", flush=True)
    return elapsed, res.returncode, res.stdout, res.stderr

def main():
    os.makedirs("bench/e3/resultados", exist_ok=True)
    
    times_up_proceso = []
    times_up_http = []
    times_build = []
    
    print("====================================================================")
    print("INICIANDO EXPERIMENTO E3: MONOLITO MODULAR VS SERVICIO EXTRAÍDO")
    print("====================================================================", flush=True)
    
    # 1. Medir tiempo de build (5 corridas)
    print("\n--- Midiendo tiempos de build (5 repeticiones) ---", flush=True)
    for i in range(1, 6):
        elapsed, code, _, _ = run_cmd("docker build -t activa360/app:e3 .")
        print(f"Build {i}: {elapsed:.2f} s", flush=True)
        times_build.append(elapsed)

    # 2. Forma en PROCESO (5 corridas con down -v intermedio)
    print("\n--- Ejecutando 5 corridas para FORMA EN PROCESO ---", flush=True)
    for i in range(1, 6):
        print(f"\n>>> Corrida {i}/5 [PROCESO] <<<", flush=True)
        run_cmd("docker compose -f compose.e3.yaml --profile \"*\" down -v")
        
        up_time, code, _, _ = run_cmd("docker compose -f compose.e3.yaml --env-file formas/proceso.env up -d --wait")
        times_up_proceso.append(up_time)
        print(f"Up-wait proceso {i}: {up_time:.2f} s", flush=True)
        
        # k6
        salida = f"proceso-colgado-{i}"
        k6_cmd = f"docker compose -f compose.e3.yaml --env-file formas/proceso.env run --rm k6 run -e FALLA=colgado -e SALIDA={salida} /k6/carga.js"
        _, _, out, _ = run_cmd(k6_cmd)
        print(out[-800:] if len(out) > 800 else out, flush=True)
        
        run_cmd("docker compose -f compose.e3.yaml --profile \"*\" down -v")

    # 3. Forma EXTRAÍDA (HTTP) (5 corridas con down -v intermedio)
    print("\n--- Ejecutando 5 corridas para FORMA EXTRAÍDA (HTTP) ---", flush=True)
    for i in range(1, 6):
        print(f"\n>>> Corrida {i}/5 [HTTP] <<<", flush=True)
        run_cmd("docker compose -f compose.e3.yaml --profile \"*\" down -v")
        
        up_time, code, _, _ = run_cmd("docker compose -f compose.e3.yaml --env-file formas/http.env up -d --wait")
        times_up_http.append(up_time)
        print(f"Up-wait http {i}: {up_time:.2f} s", flush=True)
        
        # k6
        salida = f"http-colgado-{i}"
        k6_cmd = f"docker compose -f compose.e3.yaml --env-file formas/http.env run --rm k6 run -e FALLA=colgado -e SALIDA={salida} /k6/carga.js"
        _, _, out, _ = run_cmd(k6_cmd)
        print(out[-800:] if len(out) > 800 else out, flush=True)
        
        run_cmd("docker compose -f compose.e3.yaml --profile \"*\" down -v")

    # Guardar resumen de tiempos operativos
    tiempos_operativos = {
        "build_seconds": times_build,
        "up_proceso_seconds": times_up_proceso,
        "up_http_seconds": times_up_http,
        "build_mediana": statistics.median(times_build),
        "build_rango": [min(times_build), max(times_build)],
        "up_proceso_mediana": statistics.median(times_up_proceso),
        "up_proceso_rango": [min(times_up_proceso), max(times_up_proceso)],
        "up_http_mediana": statistics.median(times_up_http),
        "up_http_rango": [min(times_up_http), max(times_up_http)],
    }
    with open("bench/e3/resultados/tiempos-operativos.json", "w", encoding="utf-8") as f:
        json.dump(tiempos_operativos, f, indent=2)

    print("\n====================================================================")
    print("TODAS LAS MEDICIONES COMPLETADAS CON ÉXITO")
    print("====================================================================", flush=True)

if __name__ == "__main__":
    main()

