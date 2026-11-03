# Publicación — 2 noviembre 2026

## Verificado

- Repositorio público: https://github.com/agrimald2/los-cursos-de-grimi
- Vercel, cuenta alonsogrimaldo-1640, equipo Latech (latech2): proyecto los-cursos-de-grimi.
- Proyecto nuevo: prj_4jBfvIUeBEjP32DPwAiprMVa8Xjt. La copia anterior se conserva en latech-peru.
- Frontend de producción: https://los-cursos-de-grimi-one.vercel.app
- Landing, alumnos, superadmin, CSS y módulos ES devuelven HTTP 200.
- Primer despliegue hecho mediante CLI; no hay vínculo Git activo todavía.

El frontend publicado sigue mostrando las demos y sus límites. No se habilitaron cobros, cuentas reales, datos compartidos ni acceso protegido de servidor.

## Dominio

Dominio agregado al proyecto nuevo: cursos.alonsogrimaldo.com. Pendiente verificación de propiedad por TXT; el dominio raíz permanece en el equipo anterior.
DNS está en Cloudflare y todavía no contiene registro para cursos.

Configuración sugerida por API de Vercel para este proyecto:

```text
Tipo: CNAME
Nombre: cursos
Destino: 3a47fee7baa006f2.vercel-dns-017.com
Proxy: DNS only

Tipo: TXT
Nombre: _vercel
Valor: vc-domain-verify=cursos.alonsogrimaldo.com,569ad8ce30f3d753cfe9
```

No cambiar nameservers ni registros del dominio raíz. Después de agregar registro, verificar dominio y certificado en Vercel. No se declara subdominio operativo hasta verificar DNS y HTTPS.

## Supabase

Usuario eligió organización LaTech. Se intentó crear proyecto dedicado en organización nativa LaTech, sin tocar bases existentes. Proveedor rechazó creación por límite de dos proyectos gratuitos activos del propietario; no se creó ningún proyecto ni se generó conexión productiva.

QA-Emma sigue en uso y debe conservarse. Pendiente: ampliar plan de Supabase o identificar explícitamente otro proyecto que puede pausarse. La nueva cuenta de Vercel no modifica el límite de Supabase. No se pausó, borró ni reutilizó ningún proyecto existente.

Después: crear proyecto dedicado, migraciones y RLS; integrar Google; asignar rol superadmin de servidor; conectar cursos, progreso, consultas y membresías. Las claves privadas y contraseñas nunca van al navegador ni al repositorio.

## Automatización Git

La cuenta nueva rechaza `vercel git connect` con: “You need to add a Login Connection to your GitHub account first. (400)”. Conectar GitHub en los ajustes de cuenta de Vercel y volver a vincular el repositorio. Hasta entonces, `git push` por sí solo no publica la app.

GitHub Actions verifica sintaxis, pruebas de estado y build; no contiene secretos ni despliega por su cuenta.

## Desplegar manualmente

```sh
npm ci
npm run check
npm run build
vercel link --yes --project los-cursos-de-grimi --scope latech2 --global-config /Users/grimmy/.config/vercel-grimi-latech
vercel deploy --prod --yes --scope latech2 --global-config /Users/grimmy/.config/vercel-grimi-latech
```

El build publica únicamente dist/. .vercelignore limita los archivos subidos al proveedor; .gitignore excluye secretos y salidas generadas del repositorio.
