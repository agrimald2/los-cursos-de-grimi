# Superadmin — progreso

Implementación y verificación completadas. Scope respetado: solamente superadmin/.

URL: http://127.0.0.1:8767/superadmin/ (servidor existente, sin reiniciar).

Implementado: dashboard, cursos/módulos/clase/materiales, CRUD de encuentros y .ics, perfiles ficticios/estados humanos de acceso, consultas y revisión AI ilustrativa, configuración comercial, exportación, actividad local. Namespace separado; borradores por pestaña; revisión + Web Locks; no éxito falso si falla guardado.

Archivos principales: index.html, style.css, app.js. Documentación: README.md, DECISIONS.md. Pruebas: test.cjs. Capturas: preview-desktop.png y preview-mobile.png.

Límites: sin backend, Google, pagos, video protegido, subida, correo ni AI. Publicación solo local; ninguna sincronización con alumnos. Grimi único humano administrador.

## Verificación completada

Suite headless aislada: PASS. CRUD y persistencia, materiales HTTPS, Meet requerido para publicar, borradores al cerrar/recargar, respuestas humanas, eliminación con confirmación, bloqueo de borrado de curso vinculado, reordenamiento de módulos, descarga .ics, conflicto de dos pestañas y fallo de almacenamiento. Sin errores de página; siete rutas sin desborde a 320px y paisaje 740×375. Revisión visual de capturas escritorio y móvil. Sin uso de pestañas visibles ni cambios a servidores existentes.

Decisión adicional: retirar publicación de un curso devuelve sus encuentros a borrador; marcar próximo también devuelve sus módulos a borrador. Adaptadores siguen pendientes.
