# Activa360

## Objetivo
Este repositorio ahora incluye una base inicial para levantar una implementación real de Activa360 con:
- React (frontend)
- Spring Boot (backend)
- Keycloak (autenticación)
- PostgreSQL, Redis y MinIO

## Servicios
- Frontend: http://localhost:5173
- Backend: http://localhost:8081
- Keycloak: http://localhost:8080
- MinIO Console: http://localhost:9001

## Inicio rápido
```bash
docker compose up -d
```

## Desarrollo local

### Backend
```bash
cd apps/api
./mvnw spring-boot:run
```

### Frontend
```bash
cd apps/web
npm install
npm run dev
```
