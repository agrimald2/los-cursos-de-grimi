# Área de alumnos — Demo funcional

Abrir desde servidor del workspace: http://127.0.0.1:8767/alumnos/index.html.
Alternativa desde raíz: `python3 -m http.server 8080 --bind 127.0.0.1`, luego `/alumnos/`.

## Vistas

- `#inicio`: continuar curso y avance.
- `#cursos`: catálogo con búsqueda, filtros y curso próximo anunciado.
- `#aula`: seis etapas disponibles, guías de ejemplo, notas, materiales TXT y consultas con respuestas.
- `#aula/security`: enlace directo a etapa de ciberseguridad; mismo patrón para IDs definidos en model.mjs.
- `#encuentros`: fecha ilustrativa, conversión Perú/Argentina y calendario ICS de ejemplo. Meet no confirmado.
- `#cuenta`: preferencias, membresía, cancelación simulada y exploración de estados.

## Datos e integraciones

Progreso, notas, preferencias, consultas y respuestas se guardan solo en localStorage, clave `grimi-alumnos-demo-v1`. El esquema limita y normaliza datos al cargar. Incluye borradores por clase y por hilo, y separa autor/cuerpo de respuestas. Si guardado falla, interfaz lo informa. Restablecer desde cuenta solo afecta esta clave de demo.

No hay autenticación, pagos, videos, moderación AI, email, reuniones ni usuarios reales. Bloqueo de acceso es demostración de UI; no es seguridad de servidor. Cancelar no recupera acceso suspendido: se separan estado de acceso y cancelación de renovación. Los tres días de gracia y vencimientos se exploran manualmente; no hay reloj de facturación.

Los textos de guías y consultas son ejemplos; no un curso producido. Material descargable es TXT, explícitamente identificado. La fecha y duración del calendario son ilustrativas, no un evento confirmado. Sin modelo 3D ni nueva generación de assets.

## Validación

- `node alumnos/check.mjs`: acceso por estado, normalización, límites, deduplicación y cálculo de progreso.
- `node --check alumnos/app.js`: sintaxis.
- Navegador: progreso y notas tras recarga; consulta y respuesta persistente; estados de gracia, cancelación y suspensión; cuenta accesible sin contenido; búsqueda vacía/restauración; horarios; descarga real de guía TXT.
- Cinco vistas revisadas en móvil estrecho y composición de escritorio; agenda ajustada para evitar desborde.
- Consola sin errores al finalizar. Datos creados durante pruebas reiniciados desde cuenta.

Marca y assets compartidos con `../public-web/assets/`. No requiere compilación ni paquetes externos; usa módulos ES nativos.

## Correcciones de auditoría v2

Guardado usa Web Locks y combinación de cambios por campo. Dos pestañas pueden actualizar datos distintos sin sobrescribirse; conflictos de texto en el mismo campo muestran aviso y conservan texto local. Navegadores sin Web Locks no confirman guardado. Fallos no limpian formularios ni muestran éxito. Reintentar confirma persistencia antes de enviar de nuevo. Si un conflicto requiere recarga, copiar texto local primero.

Borradores por clase e hilo sobreviven navegación y recarga cuando se confirma guardado. Acciones de progreso no reconstruyen formularios. Respuestas de 500 caracteres se conservan sin recorte por prefijo de autor. Cambios entre pantallas/clases llevan foco al contenido. Índice móvil plegable, instrucciones de 15–16 px y navegación desde 12 px. Acción Completar y seguir al final del contenido con destino explícito.

Verificación adicional: `node alumnos/store-check.mjs`. Pruebas de navegador en `browser-check.js`, ejecutadas por herramienta Playwright en contexto aislado: 21 comprobaciones, sin tocar sesión del usuario. Cubren borradores, fallo/reintento, dos pestañas, respuestas de 500 caracteres, foco, fechas, legibilidad y anchos de 390/320 px. Captura: review-after.png.
