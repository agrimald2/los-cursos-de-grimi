# LOS CURSOS DE GRIMI

Academia para principiantes que quieren crear apps con AI. Marca Fucsia club; clases grabadas, materiales, consultas y encuentros por curso. Membresía inicial propuesta: USD 20/mes, Perú.

Repo público: https://github.com/agrimald2/los-cursos-de-grimi

Web desplegada: https://cursos.alonsogrimaldo.com

URL alternativa: https://los-cursos-de-grimi-one.vercel.app

Detalles, DNS y bloqueos externos: [DEPLOYMENT.md](DEPLOYMENT.md).

## Estado real

Autenticación Google real en `/ingresar/`, con OAuth PKCE y Supabase Free dedicado. Primera sesión real, persistencia tras recarga, comprobación del rol del propietario y cierre de sesión verificados. Base con RLS y acceso según membresía. Los cobros y las integraciones de aula/superadmin todavía no están habilitados: esas dos aplicaciones conservan sus demos locales y no usan la base real. No hay moderación AI, email transaccional, creación de Meet ni reproducción protegida de video activos.

## Iniciar y verificar

Requiere Node.js 22 y Python 3 para preview opcional. El build empaqueta el cliente oficial Supabase con esbuild. Para probar login local, cargar la configuración pública de `.env.local` al ejecutar el build; ninguna clave privada debe incluirse.

```sh
npm ci
npm run check
npm run build
python3 -m http.server 8080 --directory dist --bind 127.0.0.1
```

- `/`: web pública, catálogo, detalle y propuesta de membresía.
- `/ingresar/`: cuenta real con Google, sesión y comprobación de permisos.
- `/privacidad.html` y `/terminos.html`: avisos de etapa de prueba aprobados por titular.
- `/alumnos/`: demo de inicio, cursos, aula, consultas, agenda y cuenta.
- `/superadmin/`: demo de cursos, contenido, encuentros, alumnos, moderación y oferta.

## Estructura

- `public-web/`: web pública y assets compartidos.
- `alumnos/`: área de alumnos, modelo y pruebas de persistencia.
- `superadmin/`: panel de Grimi con almacenamiento separado.
- `brand/`: fuente de verdad de marca, assets, tokens y generadores del manual.
- `ingresar/`: entrada de cuenta real y pruebas de navegador.
- `supabase/`: migraciones, configuración y pruebas RLS.
- `scripts/`: comprobaciones y empaquetado de archivos desplegables.
- `PRD-los-cursos-de-grimi.md`: alcance acordado.

## Publicación

Vercel utiliza `npm run build` y publica `dist/`. El build incluye solo archivos necesarios; no despliega pruebas, capturas de navegador ni documentos locales. Conectar este repositorio a Vercel habilita despliegues por cambios de GitHub. Proyecto `los-cursos-de-grimi`, equipo `latech2`, dominio `cursos.alonsogrimaldo.com`. Instalación de app GitHub de Vercel aún pendiente; los despliegues actuales se realizan por CLI.

## Integración productiva pendiente

1. Conectar aula y superadmin a tablas reales de cursos, clases, progreso, consultas y membresías.
2. Integrar entrega protegida de materiales, reuniones y video con permisos de servidor.
3. Proveedor de pagos, webhooks verificados y conciliación por período.
4. Moderación AI, email, contenido real y calendario de encuentros.

El registro de cuenta ya funciona; no concede acceso pagado. Los cobros siguen deshabilitados y las áreas internas se presentan como demos. No ingresar datos sensibles en esas demos. No se incluyen claves privadas ni secretos en código.

## Activos y licencias

Plus Jakarta Sans se distribuye con SIL Open Font License: ver `public-web/assets/OFL.txt`. Mascota y aplicaciones visuales desarrolladas para Grimi a partir de referencia autorizada. No se concede licencia general para reutilizar nombre, imagen, logos o mascota fuera de este proyecto. No se incluye archivo LICENSE de software: consultar al titular antes de reutilizarlo.
