# LOS CURSOS DE GRIMI

Academia para principiantes que quieren crear apps con AI. Marca Fucsia club; clases grabadas, materiales, consultas y encuentros por curso. Membresía inicial propuesta: S/50 por mes, Perú.

Repo público: https://github.com/agrimald2/los-cursos-de-grimi

Web desplegada: https://cursos.alonsogrimaldo.com

URL alternativa: https://los-cursos-de-grimi-one.vercel.app

Detalles, DNS y bloqueos externos: [DEPLOYMENT.md](DEPLOYMENT.md).

## Estado real

Autenticación Google real en `/ingresar/`, con OAuth PKCE y Supabase Free dedicado. Primera sesión real, persistencia tras recarga, comprobación del rol del propietario y cierre de sesión verificados. Base con RLS y acceso según membresía. Integración de Suscripciones de Mercado Pago Perú con endpoints de servidor, notificaciones firmadas, conciliación por período y cancelación. Preventa: primer curso anunciado para el 6 de noviembre de 2026. Aula y superadmin conservan demos locales y no usan la base real. No hay moderación AI, email transaccional, creación de Meet ni reproducción protegida de video activos.

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
- `server/` y `api/`: integración de pagos, autenticación y notificaciones verificadas.
- `scripts/`: comprobaciones y empaquetado de archivos desplegables.
- `PRD-los-cursos-de-grimi.md`: alcance acordado.

## Publicación

Vercel utiliza `npm run build` y publica `dist/`. El build incluye solo archivos necesarios; no despliega pruebas, capturas de navegador ni documentos locales. Conectar este repositorio a Vercel habilita despliegues por cambios de GitHub. Proyecto `los-cursos-de-grimi`, equipo `latech2`, dominio `cursos.alonsogrimaldo.com`. App oficial de Vercel instalada para este repo y conexión Git activa. Los push a main activan publicación nativa; GitHub Actions valida código, build y RLS antes de dar la revisión por aprobada.

## Integración productiva pendiente

1. Conectar aula y superadmin a tablas reales de cursos, clases, progreso, consultas y membresías.
2. Integrar entrega protegida de materiales, reuniones y video con permisos de servidor.
3. Verificar primer pago real y cancelación con un comprador; nunca simular una aprobación ni cobrar dinero real desde pruebas automatizadas.
4. Moderación AI, email, contenido real y calendario de encuentros.

El registro de cuenta ya funciona; no concede acceso pagado. La preventa requiere condiciones aceptadas y confirmación final en Mercado Pago. Las áreas internas se presentan como demos hasta la entrega anunciada. No ingresar datos sensibles en esas demos. No se incluyen claves privadas ni secretos en código.

## Activos y licencias

Plus Jakarta Sans se distribuye con SIL Open Font License: ver `public-web/assets/OFL.txt`. Mascota y aplicaciones visuales desarrolladas para Grimi a partir de referencia autorizada. No se concede licencia general para reutilizar nombre, imagen, logos o mascota fuera de este proyecto. No se incluye archivo LICENSE de software: consultar al titular antes de reutilizarlo.

## Compartir e instalar

Páginas públicas incluyen Open Graph y tarjetas PNG 1200×630 con la mascota aprobada; academia, primer curso y membresía tienen títulos y descripciones propios. Los metadatos se generan en el HTML durante el build para que no dependan de JavaScript. Las rutas duplicadas bajo `/public-web/` declaran URL canónica pública.

PWA con manifest, iconos PNG normales y maskable, acceso desde pantalla de inicio, instrucciones en `/instalar.html`, presentación pública offline y actualización elegida por el usuario. El service worker solo guarda una lista de archivos públicos. Cuenta, callbacks, respuestas de API, pagos, clases privadas y videos no se almacenan offline. La actualización no recarga automáticamente una operación en curso.

```sh
npm run assets:brand     # Exportar PNG desde assets originales de marca
npm run build
npx playwright install chromium
npm run check:pwa        # Manifest, metadatos, offline, privacidad y actualización
```

Los PNG exportados están versionados; el build de producción no necesita volver a generarlos. En equipos con Chrome instalado puede usarse `PLAYWRIGHT_CHANNEL=chrome npm run check:pwa`. GitHub Actions instala Chromium y ejecuta las mismas pruebas sin claves privadas. WhatsApp puede conservar previews de enlaces compartidos previamente; una URL nueva permite solicitar otra lectura de metadatos.
