---
name: scaffold-hexagonal-module
description: Crea la estructura de carpetas y archivos base para un nuevo módulo en Activa360 siguiendo la Arquitectura Hexagonal.
---
# Skill: Generador de Módulos Hexagonales (Activa360)

## Cuándo activarlo (triggers)
- Cuando el usuario solicite crear o inicializar un nuevo módulo en el sistema (ej. "Crea el módulo de Compliance", "Genera un nuevo módulo para Security").

## Procedimiento

1. **Definir el nombre del módulo**: Convierte el nombre solicitado a formato kebab-case (ej. `compliance`, `security`, `user-management`).
2. **Crear la estructura de carpetas**:
   Dentro de `src/modules/<nombre-del-modulo>/`, crea las siguientes subcarpetas:
   - `domain/models/`
   - `domain/ports/in/`
   - `domain/ports/out/`
   - `domain/services/`
   - `adapters/in/web/`
   - `adapters/out/persistence/`

3. **Generar archivos base**:
   - Crea el archivo `<nombre-del-modulo>.module.ts` en la raíz del módulo que ensamble la estructura usando NestJS.
   - Crea un archivo de UseCase base en `domain/ports/in/` y un Service de ejemplo que lo implemente.
   - Configura un controlador REST base en `adapters/in/web/`.

4. **Registrar el Módulo**:
   - Actualiza `src/app.module.ts` importando el nuevo módulo.

5. **Regla estricta a respetar**:
   - Verifica que ninguna de las nuevas clases importe repositorios o dependencias de otros módulos directamente, forzando la creación de Puertos o el uso de Eventos si requiere interactuar con otro dominio.
