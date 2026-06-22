# AXON TIRES - Contexto para Agentes de Antigravity IDE

Este archivo provee el contexto global y las reglas arquitectónicas de AXON TIRES para que cualquier agente o subagente de Antigravity que opere en este Workspace mantenga la coherencia del proyecto.

## Descripción del Proyecto
AXON TIRES es una plataforma de gestión logística y de inventario de neumáticos y activos para flotas de transporte. Cuenta con un Dashboard web de control y una App Móvil para operadores en terreno.

## Arquitectura y Stack Tecnológico
El proyecto está estructurado como un **Monorepositorio** utilizando NPM Workspaces.
- **Root:** `/` (contiene `package.json` principal y `package-lock.json`).
- **Backend (`apps/backend`):** Node.js, Express, TypeScript, PostgreSQL (Neon DB). 
  - Desplegado en: Render (`axon-backend`).
  - Puerto de desarrollo: 5001.
  - Base de Datos: Neon DB Serverless.
- **Frontend (`apps/dashboard`):** Next.js (App Router), React, Tailwind CSS, TypeScript.
  - Desplegado en: Vercel (`axon-tires-dashboard.vercel.app`).
  - Puerto de desarrollo: 3000.
  - Incluye tanto las vistas de escritorio (ej: `/vehicles`, `/tires`) como la aplicación móvil (bajo la ruta `/mobile/...`).

## Módulos y Lógica Core Actual
1. **Control de Flota (Vehículos):** Asignación de posiciones de neumáticos por ejes (ej: `delantero_izquierdo`, `traccion_exterior_derecho`).
2. **Punto de Control (App Móvil):** Simulación de lectura RFID. Registra salidas a ruta y llegadas a base. Genera informes de divergencia si faltan activos detectados.
3. **Gestión de Inventario (App Móvil):** Auditoría masiva de bodega mediante escáner RFID (iniciar/finalizar inventario).
4. **Gestión Masiva (App Móvil):** Baja de neumáticos o envío a recauchaje por lotes.
5. **Autenticación:** Simulada por ahora mediante el header `x-company-id: TEST`.

## Reglas de Desarrollo para Agentes
- **Frontend:** SIEMPRE usar Tailwind CSS para estilos. Mantener la estética "Dark Mode", "Glassmorphism" y colores corporativos (Vani Cyan, Slate oscuro). NUNCA usar `JSON.parse` sobre arrays que ya vienen parseados desde la API (como `affected_tires`).
- **Backend:** Mantener la validación de multi-tenant usando el middleware `requireCompany`. Todas las consultas a DB deben pasar por el pool de Postgres.
- **Despliegues:** Si se añaden dependencias, asegurar que el `npm install` se ejecute en la raíz del monorepositorio.
- **Comandos:** Para arrancar localmente, usar `npm run dev` en cada carpeta de app respectivamente.

*Este contexto te asegura que no pisemos trabajo previo ni rompamos la conexión con la nube.*
