# Laboratorio S08: imagen o Podman

- Integrante(s): Guillermo Omar Daza Alcalá, Josefina Rojas, Rita Nina
- Opción: B (stack con Podman)
- Servicio o stack: Activa360 (PostgreSQL, Redis, Keycloak, RustFS/S3, ChromaDB)
- Fecha: 4 de noviembre de 2026
- Máquina: Windows 10 Pro (Build 19045 - 22H2), Docker Desktop 29.5.3 (Docker Compose v5.1.4), Podman 5.8.3

---

## Opción B: Podman

- Podman: versión `5.8.3`, modo rootless: `true` (`podman info --format "{{.Host.Security.Rootless}}"`)
- Proveedor de `podman compose`: `docker-compose` (ejecutable externo `C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe`, versión `v5.1.4`)

| Métrica / Aspecto | Docker | Podman |
|---|---|---|
| **¿Levantó a la primera?** | Sí, levantó los 5 contenedores sin modificar el archivo original. | Requirió crear `compose.podman.yaml` especificando los registros completos (FQIN). Con esa adaptación, levantó los 5 contenedores a la primera. |
| **Cambios necesarios en `compose.yaml` o Dockerfiles** | Ninguno obligatorio (solo aviso de `version: '3.8'` obsoleto). | 1. Nombres completos de imagen (FQIN) con `docker.io/...` y `quay.io/...`.<br>2. Remoción de atributo obsoleto `version: '3.8'`. |
| **Tiempo de `up -d` desde cero (una corrida)** | **28.44 s** (medido con `Measure-Command`, imágenes pre-cacheadas). | **115.39 s** (~1 min 55 s, medido con `Measure-Command`, descarga completa desde cero de las 5 imágenes y arranque). |
| **Usuario dentro / fuera de un contenedor** | • `activa360-postgres`: UID `70`<br>• `activa360-chroma`: UID **`root`** (se ejecuta con privilegios de root en el host/WSL). | • `activa360-postgres`: Dentro = `postgres` (UID 70), Fuera (`HUSER`) = **`524357`** (subuid sin privilegios).<br>• `activa360-chroma`: Dentro = `root` (UID 0), Fuera (`HUSER`) = **`1000`** (usuario estándar de la VM, no root). |
| **¿El endpoint responde?** | Sí, Keycloak responde HTTP 200 en `http://localhost:8080`. | Sí, Keycloak responde HTTP 200 en `http://localhost:8080`, Chroma responde heartbeat en `http://localhost:8000/api/v2/heartbeat`. |

---

### Problemas y cómo los resolví

1. **Restricción de versión en Windows 10:**
   - **Error / Advertencia:** Podman 6.0 no es compatible con Windows 10.
   - **Causa:** Requisitos del kernel/WSL y arquitectura de la versión 6.
   - **Solución:** Se instaló específicamente la versión 5.8 mediante `winget install --id RedHat.Podman --source winget`, verificando `podman version 5.8.3`.

2. **Resolución de nombres cortos de imagen en Podman:**
   - **Problema:** Podman no asume por defecto `docker.io` como registro implícito para imágenes como `postgres:15-alpine` o `redis:7-alpine`.
   - **Solución:** Se creó una copia `compose.podman.yaml` anteponiendo el Fully Qualified Image Name (FQIN): `docker.io/library/postgres:15-alpine`, `docker.io/library/redis:7-alpine`, `docker.io/rustfs/rustfs:latest`, `docker.io/chromadb/chroma:latest` y manteniendo `quay.io/keycloak/keycloak:22.0.1`.

3. **Ejecución fuera del directorio del proyecto:**
   - **Error:** `open C:\Users\Administrador\compose.podman.yaml: El sistema no puede encontrar el archivo especificado.`
   - **Causa:** La consola se encontraba abierta en `C:\Users\Administrador` en lugar del directorio de la solución.
   - **Solución:** Navegación a `C:\Users\Administrador\Documents\MaestriaActFijos\Activa360` antes de ejecutar `podman compose`.

4. **Dependencia de Demonio (Docker vs Podman):**
   - **Error:** `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine...`
   - **Causa:** Docker exige que la aplicación central Docker Desktop (`dockerd`) esté en ejecución continua. Si está cerrado, la API de Docker no responde.
   - **Solución:** Iniciar Docker Desktop para tomar las mediciones comparativas de Docker, contrastando con la arquitectura *daemonless* de Podman, donde cada comando invoca directamente a la máquina virtual sin depender de un servicio UI residente.

---

### Comparación

- **Qué ganamos con Podman:**
  - **Seguridad Rootless real:** Incluso contenedores que dentro se ejecutan como `root` (como `chroma`) corren en el anfitrión asignados al UID `1000` o a rangos `subuid` (`524357`), neutralizando riesgos de escalado de privilegios en caso de escape del contenedor.
  - **Arquitectura Daemonless:** No existe un único punto de fallo como el demonio central de Docker Desktop; menor consumo de recursos de fondo cuando no hay contenedores activos.
  - **Compatibilidad con Compose:** Permite reutilizar la infraestructura existente de Docker Compose usando `podman compose` sin necesidad de reescribir la configuración del proyecto.

- **Qué perdemos o requiere atención con Podman:**
  - **Sintaxis de registros estricta:** Exige nombres calificados completos (FQIN), no bastan nombres cortos informales.
  - **Envoltorio de Compose:** `podman compose` actúa como wrapper sobre proveedores externos (`docker-compose` o `podman-compose`), por lo que su comportamiento depende del motor subyacente detectado.

---

## Comandos usados

Los comandos se ejecutaron en PowerShell en el siguiente orden:

```powershell
# 1. Instalación de Podman 5.8 para Windows 10
winget install --id RedHat.Podman --source winget

# 2. Inicialización y arranque de la máquina virtual Podman
podman machine init
podman machine start

# 3. Verificación de modo rootless y proveedor de compose
podman info --format "{{.Host.Security.Rootless}}"
podman compose version

# 4. Navegación al proyecto y levantamiento cronometrado con Podman
cd C:\Users\Administrador\Documents\MaestriaActFijos\Activa360
Measure-Command { podman compose -f compose.podman.yaml up -d }

# 5. Verificación de contenedores y mapeo de usuarios rootless en Podman
podman compose -f compose.podman.yaml ps
podman top activa360-postgres user huser pid args
podman top activa360-chroma user huser pid args

# 6. Comprobación de endpoints en Podman
curl.exe -I http://localhost:8080
curl.exe -s http://localhost:8000/api/v2/heartbeat

# 7. Desmontaje del stack en Podman
podman compose -f compose.podman.yaml down -v

# 8. Inicio de Docker Desktop y levantamiento cronometrado con Docker
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Measure-Command { docker compose up -d }

# 9. Inspección de usuarios en Docker
docker top activa360-postgres
docker top activa360-chroma

# 10. Desmontaje del stack en Docker
docker compose down -v
```

