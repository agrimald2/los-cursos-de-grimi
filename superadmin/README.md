# Superadmin de LOS CURSOS DE GRIMI

Demo HTML/CSS/JS para Grimi, único administrador humano. Marca y recursos existentes, sin dependencias de ejecución. Abrir con el servidor local del workspace: http://127.0.0.1:8767/superadmin/ . No abrir mediante file://: el guardado seguro usa Web Locks en localhost/HTTPS.

## Flujos

- Inicio: métricas derivadas exclusivamente de perfiles ficticios y actividad guardada.
- Cursos: crear, editar, eliminar, buscar y filtrar. Curso inicial con seis módulos en orden recomendado. Monetización próxima sin contenido publicado. Editor de módulo/clase con texto, referencias de video y materiales HTTPS. Reordenamiento con botones accesibles. Eliminar cursos vinculados a consultas o encuentros se bloquea para conservar contexto.
- Encuentros: CRUD por curso, fecha y zona horaria, Meet y referencia de grabación. Publicar requiere curso publicado y URL HTTPS de meet.google.com. Descargar calendario .ics no crea reuniones ni envía invitaciones.
- Alumnos: CRUD de perfiles ficticios y gestión humana de estados. Acceso activo, gracia o cancelación al cierre requiere fin vigente; pendiente no concede acceso. No hay reloj de membresías ni efectos en el aula.
- Consultas: buscar/filtrar, responder como Grimi, publicar, ocultar o eliminar con confirmación. Señales AI precargadas y simuladas. AI no responde ni suspende.
- Oferta: USD 20/mes, Perú; precio, moneda y países editables. Adaptadores pendientes, sin selección ficticia de proveedor productivo. Nunca se ingresan tarjetas.
- Respaldo JSON descargable y actividad de las últimas 100 decisiones locales. Exportación solamente; sin importación destructiva.

## Persistencia y borradores

Única clave localStorage: `grimi-superadmin-demo-v1`. Nunca se lee ni escribe almacenamiento del aula. Borrador en sessionStorage `grimi-superadmin-demo-v1:draft`, aislado por pestaña. Recuperable desde Configuración o reabriendo el mismo editor. Reemplazar otro borrador requiere confirmación. Borradores sobreviven recarga en la misma pestaña, no cierre definitivo del navegador.

Guardados serializados con Web Locks y revisión optimista comprobada dentro del lock. Pestaña desactualizada no sobreescribe cambios: muestra aviso y conserva editor/borrador. Cargar versión guardada mantiene borrador; revisarlo antes de guardar de nuevo. Al fallar persistencia no se cierra editor ni se muestra éxito. Navegador sin Web Locks bloquea guardado y explica alternativa. Datos ilegibles bloquean escrituras, no se reinician silenciosamente.

## Verificación

`test.cjs` usa Playwright ya instalado y Chrome headless, con contexto aislado y sin tocar pestañas visibles. Ejecutar:

```sh
PLAYWRIGHT_MODULE=/ruta/al/modulo/playwright node superadmin/test.cjs
```

Puede configurarse `SUPERADMIN_URL`. Prueba CRUD, validación HTTPS, publicación incompleta, recuperación de borrador, moderación humana, persistencia tras recarga, conflicto entre dos pestañas, fallo simulado de almacenamiento, rutas a 320px, paisaje, namespace y errores de página. Capturas en preview-desktop.png y preview-mobile.png.

## Límites

Sin backend, autenticación o autorización reales, pagos, video protegido, carga de archivos, email, creación de Meet ni AI. URLs son referencias editables y no se abren ni verifican contra proveedores; no usar datos personales ni secretos. Contenido y referencias no se sincronizan con alumnos o web pública. Un módulo contiene una clase de demo. La publicación es un estado local y no hace contenido visible fuera de este panel. Historial no es auditoría segura de servidor. Producción requiere integraciones y políticas del PRD.
