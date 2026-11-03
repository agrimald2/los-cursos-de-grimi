# Backend de Grimi

Proyecto dedicado `zmcjpttzwgbfczpuxusn`, organización nueva Latech `rvwptkjyiprqlaskteej`, región São Paulo, instancia nano Free. QA-Emma y proyectos anteriores no se modifican.

## Estado

Migración `20261103000100_academy.sql` aplicada. Tablas para perfiles, membresías, cursos, clases, progreso, notas, consultas, respuestas, encuentros y oferta. Registro de usuario crea perfil y membresía pendiente, nunca acceso pagado ni rol de administrador. No se insertaron contenidos de demo en la base real.

Todas las tablas usan RLS. Catálogo publicado y precio son públicos; clases y encuentros requieren acceso vigente; progreso y notas se aíslan por usuario; publicaciones ocultas no se muestran a alumnos. El rol de administrador vive en esquema privado y solo se asigna desde servidor. La moderación no puede alterarse desde una cuenta de alumno. AI y cobros no están integrados.

`my_access()` informa acceso de la sesión actual, sin aceptar identificadores de otro usuario. La membresía activa exige fin pagado futuro; gracia nunca supera tres días desde fin pagado. Cancelación con proveedor y webhooks quedan pendientes hasta elegir proveedor de pago; ningún botón local concede acceso en esta base.

## Autenticación

Entrada real en `/ingresar/`, cliente oficial Supabase JS, OAuth PKCE. La página consulta disponibilidad del proveedor y deshabilita Google hasta configurarlo. Sesión real consulta `my_access()`; el aula y superadmin existentes siguen siendo demos separadas. Cerrar sesión elimina sesión local de este navegador.

Google Cloud: proyecto separado `los-cursos-de-grimi`. Marca `LOS CURSOS DE GRIMI`, público externo. Cliente web creado y conectado a Supabase, con:

- Origen: `https://cursos.alonsogrimaldo.com`
- Retorno Google → Supabase: `https://zmcjpttzwgbfczpuxusn.supabase.co/auth/v1/callback`
- Retorno Supabase → app: `https://cursos.alonsogrimaldo.com/ingresar/`
- Acceso mínimo: identidad OpenID, email y perfil. Sin Drive, Gmail ni Calendar.

Consola Google confirma estado “En producción”, con avisos de privacidad y condiciones publicados y aprobados por titular. La verificación de marca es un proceso distinto y no se declara completada.

Client ID y Client Secret configurados en proveedor Google de Supabase; nunca en HTML, chat, Git ni configuración pública. Archivo local temporal eliminado tras transferencia. Google enabled=true y comprobación de nonce activa. Consentimiento y primera sesión real completados por titular; persistencia, RPC y cierre de sesión comprobados. No ejecutar `supabase config push` sin preservar configuración Google remota; ese comando puede comparar proveedores con valores por defecto.

## Secretos y build

Vercel `latech2` recibe solo `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. El build genera `assets/config.json`, rechazando claves `service_role`, claves `sb_secret_` y URLs ajenas a Supabase. Contraseña de DB permanece en archivo local ignorado, permisos 600. No se agrega service-role al navegador.

CLI de Supabase usa plataforma `supabase`; `--profile` selecciona plataforma, no cuenta. No usar `--profile grimi-latech`. La CLI está autenticada con cuenta nueva y el workspace vinculado al proyecto indicado arriba. Antes de cualquier operación, comprobar referencia en `supabase/.temp/project-ref`.

```sh
npm run check
npm run check:database
supabase db push --dry-run
supabase db push
supabase db advisors --linked --type security --level warn
```

`check:database` arranca Postgres 17 aislado sin red, crea sustituto mínimo de Supabase Auth, aplica migración y verifica RLS: privacidad, escalamiento de privilegios, borradores, membresía vencida/gracia y moderación. Destruye únicamente contenedor temporal creado por esa prueba.

`ingresar/check.cjs` ejecuta pruebas de navegador aisladas: proveedor no configurado, PKCE, sesión simulada sin membresía, salida y móvil. No sustituye prueba de consentimiento Google real. Requiere Playwright existente y build con configuración pública.

Único superadmin ya asignado tras verificar UUID, correo confirmado e identidad Google del titular en `auth.users`/`auth.identities`. Rol almacenado en `private.admins`, confirmado desde RPC con sesión real. No hay asignación automática por email ni `user_metadata`.
