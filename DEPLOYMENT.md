# Publicación — 2 noviembre 2026

## Verificado

- Repositorio público: https://github.com/agrimald2/los-cursos-de-grimi
- Vercel, equipo LaTech: proyecto los-cursos-de-grimi.
- Frontend de producción: https://los-cursos-de-grimi.vercel.app
- Landing, alumnos, superadmin, CSS y módulos ES devuelven HTTP 200.
- Primer despliegue hecho mediante CLI; no hay vínculo Git activo todavía.

El frontend publicado sigue mostrando las demos y sus límites. No se habilitaron cobros, cuentas reales, datos compartidos ni acceso protegido de servidor.

## Dominio

Dominio agregado al proyecto Vercel: cursos.alonsogrimaldo.com.
DNS está en Cloudflare y todavía no contiene registro para cursos.

Configuración sugerida por API de Vercel para este proyecto:

```text
Tipo: CNAME
Nombre: cursos
Destino: 4da7844f5a5d6694.vercel-dns-017.com
Proxy: DNS only
```

No cambiar nameservers ni registros del dominio raíz. Después de agregar registro, verificar dominio y certificado en Vercel. No se declara subdominio operativo hasta verificar DNS y HTTPS.

## Supabase

Usuario eligió organización LaTech. Se intentó crear proyecto dedicado en organización nativa LaTech, sin tocar bases existentes. Proveedor rechazó creación por límite de dos proyectos gratuitos activos del propietario; no se creó ningún proyecto ni se generó conexión productiva.

Pendiente: usuario amplía plan o identifica explícitamente proyecto que puede pausarse. No se pausó, borró ni reutilizó ningún proyecto existente.

Después: crear proyecto dedicado, migraciones y RLS; integrar Google; asignar rol superadmin de servidor; conectar cursos, progreso, consultas y membresías. Las claves privadas y contraseñas nunca van al navegador ni al repositorio.

## Automatización Git

Vinculación del repositorio mediante `vercel git connect` fue rechazada por proveedor. El proyecto Vercel informa `link: null`. Revisar acceso de integración GitHub desde Settings → Git del proyecto y volver a conectar. Hasta entonces, `git push` por sí solo no publica la app.

GitHub Actions verifica sintaxis, pruebas de estado y build; no contiene secretos ni despliega por su cuenta.

## Desplegar manualmente

```sh
npm ci
npm run check
npm run build
vercel link --yes --project los-cursos-de-grimi --scope latech-peru
vercel deploy --prod --yes --scope latech-peru
```

El build publica únicamente dist/. .vercelignore limita los archivos subidos al proveedor; .gitignore excluye secretos y salidas generadas del repositorio.
