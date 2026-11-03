# LOS CURSOS DE GRIMI — Web pública v1

Primera implementación local del área pública. HTML, CSS y JavaScript sin dependencias de compilación. Landing, detalle de curso y membresía comparten tokens Fucsia club, fuente local y mascota aprobada.

## Abrir

Desde esta carpeta: `python3 -m http.server 8080 --bind 127.0.0.1`.
Visitar `http://127.0.0.1:8080/`.

En la sesión actual se usa servidor del workspace: `http://127.0.0.1:8767/public-web/`.

## Incluido

- Landing: propuesta, modalidad, catálogo con búsqueda y filtros, Grimi, precio y FAQ.
- Curso: seis etapas con acordeones, modalidad, objetivos y CTA de membresía.
- Membresía: inclusiones, precio, cancelación, reglas y explicación del ingreso futuro.
- Menú móvil accesible, diálogos nativos, navegación entre páginas y estados vacíos.
- Fuente y assets locales; no requiere servicios externos para renderizar.

## Límites de esta entrega

No implementa Google OAuth, cobros, backend, acceso al aula ni administración. No captura formularios ni datos de tarjetas. Las acciones de ingreso explican el flujo sin simular una suscripción exitosa. No publicado en hosting externo. Las páginas llevan noindex mientras son una vista previa.

## Verificación

JavaScript verificado con `node --check assets/site.js`. Respuestas HTTP y archivos enlazados comprobados. Navegación landing → curso → membresía, búsqueda sin resultados, restauración, menú móvil y diálogo de ingreso probados en navegador. Layout comprobado en vista de escritorio y móvil estrecha, sin desborde del documento. Consola sin errores.

Fuente Plus Jakarta Sans distribuida con SIL OFL; licencia en assets/OFL.txt. Tokens copiados desde manual aprobado; sincronizar desde brand/tokens/tokens.css si cambian.
