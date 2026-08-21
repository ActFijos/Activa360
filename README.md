# Activa360 — Sistema de Control de Activos Fijos (SCAF)

Activa360 es una plataforma empresarial moderna para la gestión, control, trazabilidad, inspección y baja de activos fijos de la Universidad Mayor de San Simón (UMSS). Diseñada bajo **Arquitectura Hexagonal** en el backend y una interfaz de usuario fluida y reactiva en el frontend.

---

## 🚀 Arquitectura y Tecnologías

### Backend (Directorio Raíz)
* **Framework:** NestJS (Node.js)
* **Base de Datos:** PostgreSQL (con Prisma ORM, mapeado sobre el esquema `app`)
* **Autenticación:** Keycloak (OAuth2 / OpenID Connect)
* **Base de Datos Vectorial (RAG):** Chroma DB (ejecutándose en contenedor Docker)
* **IA & Orquestación:** Servidor MCP (Model Context Protocol) integrado para consulta segura de activos fijos y manuales.

### Frontend (`/frontend`)
* **Framework:** React con Vite y TypeScript
* **Diseño:** CSS modular premium con soporte para modo oscuro
* **Seguridad:** Keycloak JS Adapter integrado

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu entorno local:
1. **Node.js** (Versión 18 o superior) y **npm**
2. **Docker Desktop** (para los contenedores de PostgreSQL, Keycloak y Chroma DB)
3. **Git**

---

## ⚙️ Configuración y Variables de Entorno

### 1. Variables de Backend (Archivo `.env` en la raíz)
Crea o edita el archivo `.env` en el directorio raíz del proyecto con la siguiente configuración:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/activa360?schema=app"
KEYCLOAK_AUTH_SERVER_URL="http://localhost:8080"
KEYCLOAK_REALM="activa360"
KEYCLOAK_CLIENT_ID="activa360-backend"
KEYCLOAK_CLIENT_SECRET="tu_client_secret_aquí"

# API Key para el Asistente IA (Opcional, si no se define opera en modo Offline Local)
GEMINI_API_KEY="tu_api_key_de_gemini"
CHROMA_URL="http://localhost:8000"
```

### 2. Variables de Frontend (Archivo `frontend/.env`)
Crea o edita el archivo `.env` dentro del directorio `frontend/`:

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=activa360
VITE_KEYCLOAK_CLIENT_ID=activa360-frontend
VITE_API_URL=http://localhost:3000
```

---

## 📦 Instrucciones para Correr el Sistema

Sigue estos pasos en orden para levantar la aplicación completa:

### Paso 1: Levantar la Infraestructura Docker (Base de Datos + Keycloak + Chroma)
Desde el directorio raíz del proyecto, ejecuta:
```bash
docker-compose up -d
```
*Esto iniciará los contenedores de PostgreSQL (puerto `5432`), Keycloak (puerto `8080`) y Chroma DB (puerto `8000`).*

### Paso 2: Configurar la Base de Datos (Migraciones y Semilla de Datos)
Instala las dependencias del backend, ejecuta las migraciones de Prisma para crear las tablas en el esquema `app` y siembra los datos iniciales de prueba (usuarios, activos, asignaciones, bajas y transferencias):

```bash
# 1. Instalar dependencias del backend
npm install

# 2. Ejecutar las migraciones de base de datos
npx prisma migrate dev

# 3. Cargar la semilla de datos (Seed)
npx prisma db seed
```

### Paso 3: Iniciar el Backend (NestJS)
Para arrancar el servidor del backend en modo desarrollo con recarga automática:
```bash
npm run start:dev
```
*El backend se levantará en [http://localhost:3000](http://localhost:3000).*

### Paso 4: Iniciar el Frontend (React + Vite)
Abre otra terminal y navega al directorio del frontend para instalar sus dependencias y levantar el servidor web:
```bash
# 1. Ir a la carpeta frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Arrancar servidor de desarrollo
npm run dev
```
*El frontend estará disponible en [http://localhost:5173](http://localhost:5173).*

---

## 🧠 Agente de Asistencia Inteligente Avanzada (MCP + Chroma RAG)

El sistema cuenta con un **Agente IA Avanzado** accesible en el panel lateral a través de la ruta `/ayuda/agente-mcp`. Este agente se comunica con el backend NestJS a través de endpoints seguros y ofrece respuestas automáticas sobre:

* **Búsquedas de Activos**: Permite filtrar y listar activos por categoría, ubicación, código QR y descripción.
* **Historial e Ingesta de Bajas**: Detalla la trazabilidad y autorizaciones del catálogo institucional de bajas.
* **Consulta Documental (RAG)**: Indexa semánticamente y responde preguntas basándose en el Manual de Usuario de Activa360 (`docs/manual_scaf.md`).

### Modos de Operación:
1. **Modo Online (Recomendado):** Si configuras `GEMINI_API_KEY` en tu `.env`, el agente utilizará embeddings vectoriales en Chroma DB y el modelo Gemini para redactar respuestas contextuales fluidas y precisas.
2. **Modo Offline (Respaldo Local):** Si no se define una clave API de Gemini, el asistente se adaptará automáticamente a una lógica local offline de búsqueda por palabras clave mejorada con boost temático, permitiendo resolver consultas documentales y bases de datos locales sin costos de API externos.

---

## 📋 Comandos de Prueba (Testing)

Para correr la suite de pruebas unitarias y de integración del backend:
```bash
# Correr tests unitarios
npm run test

# Correr tests con cobertura
npm run test:cov
```
