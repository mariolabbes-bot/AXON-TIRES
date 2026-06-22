# AXON TIRES - Logística y Gestión de Flotas 🚛

AXON TIRES es una plataforma integral para la gestión logística, control de inventario de neumáticos y auditoría de activos de flotas de transporte. Diseñada para operar de forma híbrida: un centro de comando (Dashboard) y herramientas en terreno (App Móvil).

## Arquitectura (Monorepositorio)

Este proyecto está construido como un Monorepositorio usando NPM Workspaces.

### Backend (`apps/backend`)
API RESTful que maneja la lógica de negocio y persistencia de datos.
- **Stack:** Node.js, Express, TypeScript.
- **Base de Datos:** PostgreSQL en **Neon DB** (Serverless).
- **Despliegue de Producción:** Render.

### Dashboard & App Móvil (`apps/dashboard`)
Aplicación web responsiva que provee tanto las interfaces de administración de escritorio como las vistas optimizadas para celulares de los operarios en terreno.
- **Stack:** Next.js (App Router), React, Tailwind CSS, TypeScript.
- **Estética:** Dark Mode, Glassmorphism, interfaz inmersiva.
- **Despliegue de Producción:** Vercel.

## Flujos Principales Implementados

1. **Gestión de Vehículos y Neumáticos:** Asignación visual por ejes y posiciones.
2. **Punto de Control (App Móvil):** Sistema de control de salida a ruta y llegada a base simulando escáneres RFID para generar informes automáticos de divergencia si faltan piezas.
3. **Gestión de Inventario (App Móvil):** Sistema de auditoría masiva de bodega para actualizar el stock real vs el sistema.
4. **Actualización Masiva:** Posibilidad de dar de baja neumáticos o enviarlos a recauchaje por lotes.

## Entorno Local de Desarrollo

Desde la raíz del proyecto, instala todas las dependencias (el monorepo se encargará de enlazar todo):
```bash
npm install
```

Para correr las aplicaciones, debes levantar ambas terminales:
```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/dashboard
npm run dev
```

## Nube y Producción
- La base de datos es gestionada directamente en la nube por Neon.
- Cualquier *push* a la rama `main` en GitHub desencadena un despliegue automático hacia Render (Backend) y Vercel (Frontend).
