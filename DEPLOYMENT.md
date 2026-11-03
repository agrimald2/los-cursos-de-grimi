# Publicación — 2 noviembre 2026

## Verificado

- Repositorio público: https://github.com/agrimald2/los-cursos-de-grimi
- Vercel, cuenta alonsogrimaldo-1640, equipo Latech (latech2): proyecto los-cursos-de-grimi.
- Proyecto nuevo: prj_4jBfvIUeBEjP32DPwAiprMVa8Xjt. La copia anterior se conserva en latech-peru.
- Dominio público verificado: https://cursos.alonsogrimaldo.com
- URL alternativa: https://los-cursos-de-grimi-one.vercel.app
- Landing, alumnos, superadmin, CSS y módulos ES devuelven HTTP 200.
- Repositorio GitHub vinculado a Vercel; instalación limitada a este repositorio. Primera publicación fue por CLI.

La entrada de cuenta ya usa Google y Supabase reales. Aula y superadmin conservan demos locales identificadas. No se habilitaron cobros ni se conectaron todavía sus contenidos al backend.

## Dominio

Dominio cursos.alonsogrimaldo.com verificado en el proyecto nuevo. El dominio raíz permanece en el equipo anterior. DNS está en Cloudflare, con proxy activo. La API de Vercel informa verified: true y misconfigured: false.

HTTPS devuelve HTTP 200 en landing, alumnos, superadmin y CSS. El alias apunta a dpl_6jgHuDBy9LNJFSXc8gPYh7d1hC8m, proyecto prj_4jBfvIUeBEjP32DPwAiprMVa8Xjt, equipo latech2.

Registros utilizados para asignación y verificación (la recomendación inicial era DNS only; el proxy actual también supera las verificaciones):

```text
Tipo: CNAME
Nombre: cursos
Destino: 3a47fee7baa006f2.vercel-dns-017.com
Proxy: DNS only

Tipo: TXT
Nombre: _vercel
Valor: vc-domain-verify=cursos.alonsogrimaldo.com,569ad8ce30f3d753cfe9
```

No se modificaron nameservers ni registros del dominio raíz. Propiedad, asignación a la cuenta nueva y HTTPS ya fueron verificados.

## Supabase y Google

La cuenta anterior alcanzó límite gratuito; no se modificó. Usuario autorizó cuenta nueva y plan Free. Proyecto dedicado los-cursos-de-grimi, referencia zmcjpttzwgbfczpuxusn, organización Latech rvwptkjyiprqlaskteej, región sa-east-1, nano, ACTIVE_HEALTHY.

Migración 20261103000100_academy aplicada. Diez tablas públicas con RLS y rol administrativo en esquema privado. Validación con Postgres aislado y consultas anónimas a API real: perfiles, membresías y clases devuelven 401 a visitantes; catálogo solo ofrece metadatos públicos. Revisión de seguridad de Supabase sin alertas.

Google Cloud: proyecto separado los-cursos-de-grimi, cliente Grimi Web · Supabase. Client Secret configurado exclusivamente en proveedor de Supabase; archivo temporal de transferencia eliminado. Vercel recibe solo URL y clave pública anon. El build rechaza claves de servidor. MFA TOTP disponible; no se solicita acceso a Gmail, Drive ni Calendar.

`/ingresar/` usa cliente oficial Supabase con PKCE. Recorrido real Google → callback Supabase → cuenta comprobado con titular, incluyendo sesión tras recarga y cierre. Propietario identificado por UUID de usuario Google verificado y asignado como único administrador desde servidor. Registro normal crea membresía pendiente y nunca concede rol ni acceso pagado.

Avisos de privacidad y condiciones de etapa de prueba aprobados por titular para publicación. Consola Google confirma OAuth “En producción”; ya no está restringido al modo de prueba. Esto no equivale a verificación de marca de Google. No se subió logotipo ni se solicitaron permisos sensibles o restringidos.

QA-Emma y bases anteriores siguen intactos. Aula y superadmin existentes continúan como demos locales; sus datos no se migraron ni sincronizaron automáticamente. Integración de esas pantallas, contenido real y pagos siguen pendientes.

Detalles de backend y pruebas: [supabase/README.md](supabase/README.md).

## Automatización Git

App oficial de Vercel instalada únicamente para agrimald2/los-cursos-de-grimi con aprobación del titular. `vercel git connect` devuelve Connected en equipo latech2. Cada push a main debe activar despliegue de producción; verificar estado final del commit antes de declararlo publicado.

GitHub Actions valida sintaxis, estado local, configuración pública, build y políticas de base con Postgres aislado. Validación del commit 03626cc aprobada. La prueba de DB usa TCP para esperar servidor definitivo, evitando confundir instancia temporal de inicialización con servidor listo.

GitHub Actions no contiene secretos ni ejecuta despliegue por su cuenta; la publicación la realiza integración nativa GitHub→Vercel.

## Desplegar manualmente

```sh
npm ci
npm run check
npm run build
vercel link --yes --project los-cursos-de-grimi --scope latech2 --global-config /Users/grimmy/.config/vercel-grimi-latech
vercel deploy --prod --yes --scope latech2 --global-config /Users/grimmy/.config/vercel-grimi-latech
```

El build publica únicamente dist/. .vercelignore limita los archivos subidos al proveedor; .gitignore excluye secretos y salidas generadas del repositorio.
