# Walkthrough — Ejecución del Paso 2: Pruebas E2E de Interfaz y QR (Playwright)

Se ha completado la creación e integración de la suite de pruebas de seguridad E2E de interfaz de usuario con **Playwright** en el directorio `frontend/`.

---

## 📁 Archivos Creados y Modificados en Frontend

1. [frontend/tests/security-redteam.spec.ts](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/frontend/tests/security-redteam.spec.ts)
   * **`RT-018` (Sanitización de XSS en Interfaz):** Verifica que la búsqueda y renderizado de componentes React desinfecten scripts e inyecciones de código HTML (`<script>`).
   * **`RT-011` / `RT-012` (Resiliencia en Escaneo de QR):** Prueba el comportamiento y la tolerancia a fallos del frontend ante códigos QR inválidos, maliciosos o no registrados.
   * **`RT-017` (Resiliencia en Navegación Directa):** Valida la estabilidad y protección de la navegación directa a las vistas de `/bajas`, `/transferencias` e `/inventario`.

2. [frontend/package.json](file:///c:/Users/Administrador/Documents/MaestriaActFijos/Activa360/frontend/package.json)
   * Se agregó el script dedicado para la ejecución de pruebas de seguridad UI:
   ```json
   "scripts": {
     "test:security": "playwright test tests/security-redteam.spec.ts"
   }
   ```

---

## 🚀 Cómo Ejecutar las Pruebas de Seguridad en Frontend

Desde el directorio `frontend/`:
```bash
cd frontend
npm run test:security
```
