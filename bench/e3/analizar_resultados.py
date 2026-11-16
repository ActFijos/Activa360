import json
import glob
import os
import statistics

def fmt(med, r_min, r_max):
    return f"{med:.1f} ({r_min:.1f}–{r_max:.1f})"

def fmt_pct(med, r_min, r_max):
    return f"{med:.1f}% ({r_min:.1f}%–{r_max:.1f}%)"

def analizar():
    formas = ["proceso", "http"]
    rutas = ["reportes", "activos"]
    fases = ["antes", "falla", "despues"]
    
    tablas = {}
    
    for forma in formas:
        archivos = [f"bench/e3/resultados/{forma}-colgado-{i}.json" for i in range(1, 6)]
        datos = []
        for arch in archivos:
            if not os.path.exists(arch):
                print(f"Advertencia: no se encontró {arch}")
                continue
            with open(arch, "r", encoding="utf-8") as f:
                datos.append(json.load(f))
        
        if not datos:
            continue
            
        filas = []
        for ruta in rutas:
            for fase in fases:
                key_dur = f"http_req_duration{{ruta:{ruta},fase:{fase}}}"
                key_fail = f"http_req_failed{{ruta:{ruta},fase:{fase}}}"
                
                p50_vals = []
                p95_vals = []
                max_vals = []
                fail_vals = []
                
                for d in datos:
                    m = d.get("metrics", {})
                    if key_dur in m and "values" in m[key_dur]:
                        v = m[key_dur]["values"]
                        p50_vals.append(v.get("med", 0))
                        p95_vals.append(v.get("p(95)", 0))
                        max_vals.append(v.get("max", 0))
                    if key_fail in m and "values" in m[key_fail]:
                        fail_vals.append(m[key_fail]["values"].get("rate", 0) * 100)
                
                if p50_vals:
                    p50_med = statistics.median(p50_vals)
                    p50_min, p50_max = min(p50_vals), max(p50_vals)
                    p95_med = statistics.median(p95_vals)
                    p95_min, p95_max = min(p95_vals), max(p95_vals)
                    max_med = statistics.median(max_vals)
                    max_min, max_max = min(max_vals), max(max_vals)
                    fail_med = statistics.median(fail_vals)
                    fail_min, fail_max = min(fail_vals), max(fail_vals)
                    
                    filas.append({
                        "ruta": ruta,
                        "fase": fase,
                        "p50": fmt(p50_med, p50_min, p50_max),
                        "p95": fmt(p95_med, p95_min, p95_max),
                        "max": fmt(max_med, max_min, max_max),
                        "fail": fmt_pct(fail_med, fail_min, fail_max),
                        "p95_num": p95_med,
                        "fail_num": fail_med
                    })
        tablas[forma] = filas
        
    # Leer tiempos operativos
    tiempos = {}
    if os.path.exists("bench/e3/resultados/tiempos-operativos.json"):
        with open("bench/e3/resultados/tiempos-operativos.json", "r", encoding="utf-8") as f:
            tiempos = json.load(f)
            
    print("\n### TABLA RESUMEN GENERAL (MEDIANA Y RANGO 5 CORRIDAS)")
    print("| Forma | Ruta | Fase | p50 (ms) | p95 (ms) | Max (ms) | % Errores |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for forma, filas in tablas.items():
        for f in filas:
            print(f"| `{forma}` | `{f['ruta']}` | `{f['fase']}` | {f['p50']} | {f['p95']} | {f['max']} | {f['fail']} |")
            
    if tiempos:
        print("\n### TIEMPOS OPERATIVOS (MEDIANA Y RANGO)")
        print(f"- **Build Image**: {tiempos['build_mediana']:.2f} s ({tiempos['build_rango'][0]:.2f}s – {tiempos['build_rango'][1]:.2f}s)")
        print(f"- **Up-Wait Proceso**: {tiempos['up_proceso_mediana']:.2f} s ({tiempos['up_proceso_rango'][0]:.2f}s – {tiempos['up_proceso_rango'][1]:.2f}s)")
        print(f"- **Up-Wait HTTP (Extraído)**: {tiempos['up_http_mediana']:.2f} s ({tiempos['up_http_rango'][0]:.2f}s – {tiempos['up_http_rango'][1]:.2f}s)")

if __name__ == "__main__":
    analizar()

