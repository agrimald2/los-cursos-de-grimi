# LOS CURSOS DE GRIMI

Academia para principiantes que quieren crear apps con AI. Marca Fucsia club; clases grabadas, materiales, consultas y encuentros por curso. Membresía inicial propuesta: USD 20/mes, Perú.

Repo público: https://github.com/agrimald2/los-cursos-de-grimi

Web desplegada: https://cursos.alonsogrimaldo.com

URL alternativa: https://los-cursos-de-grimi-one.vercel.app

Detalles, DNS y bloqueos externos: [DEPLOYMENT.md](DEPLOYMENT.md).

## Estado real

Implementación de interfaz y demos funcionales locales. Web pública, alumnos y superadmin están conectados como experiencia visual, pero **no comparten todavía una base de datos real**. No hay Google OAuth, pagos, email, moderación AI ni reproducción protegida de video activos. Los datos demo se guardan en navegador con namespaces separados. Un despliegue de Vercel no convierte esos controles en autenticación ni autorización.

## Iniciar y verificar

Requiere Node.js 22+ y Python 3 para preview opcional. Sin dependencias de ejecución.

```sh
npm ci
npm run check
npm run build
python3 -m http.server 8080 --directory dist --bind 127.0.0.1
```

- `/`: web pública, catálogo, detalle y membresía.
- `/alumnos/`: demo de inicio, cursos, aula, consultas, agenda y cuenta.
- `/superadmin/`: demo de cursos, contenido, encuentros, alumnos, moderación y oferta.

## Estructura

- `public-web/`: web pública y assets compartidos.
- `alumnos/`: área de alumnos, modelo y pruebas de persistencia.
- `superadmin/`: panel de Grimi con almacenamiento separado.
- `brand/`: fuente de verdad de marca, assets, tokens y generadores del manual.
- `scripts/`: comprobaciones y empaquetado de archivos desplegables.
- `PRD-los-cursos-de-grimi.md`: alcance acordado.

## Publicación

Vercel utiliza `npm run build` y publica `dist/`. El build incluye solo archivos necesarios; no despliega pruebas, capturas de navegador ni documentos locales. Conectar este repositorio a Vercel habilita despliegues por cambios de GitHub. Nombre de proyecto propuesto: `los-cursos-de-grimi`. Dominio propuesto: `cursos.alonsogrimaldo.com`.

## Integración productiva pendiente

1. Proyecto dedicado de Supabase, migraciones y políticas RLS.
2. Identidad Google y rol de superadmin asignado desde servidor.
3. Datos compartidos de cursos, clases, progreso, consultas y membresías.
4. Control de acceso de servidor para contenido, materiales y enlaces.
5. Proveedor de pagos, webhooks verificados y conciliación por período.
6. Video protegido, moderación, email y contenido real.

Mientras eso no esté integrado, registro y cobros continúan deshabilitados y las áreas internas se presentan como demos. No ingresar datos sensibles. No se incluyen claves privadas ni secretos en código.

## Activos y licencias

Plus Jakarta Sans se distribuye con SIL Open Font License: ver `public-web/assets/OFL.txt`. Mascota y aplicaciones visuales desarrolladas para Grimi a partir de referencia autorizada. No se concede licencia general para reutilizar nombre, imagen, logos o mascota fuera de este proyecto. No se incluye archivo LICENSE de software: consultar al titular antes de reutilizarlo.
