---
proyecto: "LOS CURSOS DE GRIMI"
cliente: "Academia propia de Grimi"
contacto: "Grimi"
fecha: "02 de noviembre de 2026"
version: "0.1 — borrador para revisión"
---

# PRD: LOS CURSOS DE GRIMI

## 1. Resumen Ejecutivo

Webapp de academia propia para principiantes que quieren crear aplicaciones con AI. Una membresía mensual da acceso a todos los cursos, clases grabadas, materiales, consultas compartidas y encuentros semanales por curso en Google Meet. Lanzamiento inicial en Perú a USD 20/mes. Precio, moneda y países habilitados serán configurables por el único superadmin, Grimi. Branding se definirá en una sesión posterior.

## 2. Problema

El producto busca dar a principiantes un recorrido guiado desde una idea hasta una app publicada, incorporando robustez y ciberseguridad. Necesitan contenido que puedan retomar y espacios para resolver dudas. Grimi necesita centralizar contenido, comunidad de consultas, encuentros y acceso por suscripción. No se relevó una plataforma anterior ni métricas de base.

## 3. Objetivos

- Vender y renovar una membresía mensual con control de acceso verificable.
- Permitir recorrer un curso completo con progreso guardado, materiales y consultas por clase.
- Facilitar encuentros semanales por curso y acceso posterior a sus grabaciones.
- Permitir a Grimi operar la academia sin otros administradores humanos.
- Integrar proveedores de pago mediante un contrato común sin acoplar el aula a sus estados particulares.

## 4. Alcance

### 4.1 Incluido

Catálogo y detalle de cursos; ingreso con Google; suscripción mensual; aula con módulos, ruta recomendada y progreso; materiales descargables; videos protegidos con marca de agua; encuentros por Google Meet y grabaciones; preguntas y respuestas persistentes; moderación asistida por AI; cuenta y cancelación; panel de superadmin; capa de integración de pagos extensible.

Curso inicial: **Tu primera app con AI**. Ruta: idea → diseño con AI → construcción → robustez (validaciones, errores y pruebas) → ciberseguridad (acceso, datos y secretos) → publicación. Todos los módulos están disponibles desde el inicio: la ruta orienta, no bloquea.

Curso de monetización: anunciado como **próximamente**, sin prometer fecha ni contenido disponible.

### 4.2 Excluido

Certificados, comunidad externa, marketplace de profesores, roles de docentes o moderadores humanos adicionales, chat en tiempo real, respuestas educativas automáticas con AI, reservas o cupos para encuentros, app móvil nativa, compra individual de cursos y descarga oficial de videos. Monetización como curso consumible queda fuera del lanzamiento.

## 5. Usuarios Objetivo

- **Visitante:** principiante interesado en conocer oferta y membresía.
- **Alumno:** ingresa con Google, aprende a su ritmo, consulta y asiste a encuentros.
- **Superadmin:** únicamente Grimi; configura oferta, gestiona contenido, encuentros, alumnos y moderación.
- AI es un servicio auxiliar de moderación; no tiene facultad para sancionar cuentas.

## 6. User Stories

- Como visitante quiero conocer temario, modalidad y precio para decidir si suscribirme. **Aceptación:** distingo curso disponible de próximo y conozco renovación mensual antes del pago.
- Como alumno quiero pagar una membresía para acceder a todos los cursos disponibles. **Aceptación:** pago confirmado habilita acceso; pago pendiente no lo habilita por sí solo.
- Como alumno quiero retomar mi recorrido para continuar aprendiendo. **Aceptación:** progreso persiste entre sesiones y puedo abrir cualquier módulo disponible.
- Como alumno quiero preguntar y responder por clase para aprender de otros. **Aceptación:** consultas publicadas persisten, se vinculan a su clase y admiten respuestas de otros alumnos habilitados.
- Como alumno quiero cancelar sin contactar a soporte. **Aceptación:** cancelación detiene futuras renovaciones y muestra fecha de fin del acceso pagado.
- Como superadmin quiero revisar contenido retenido por AI. **Aceptación:** puedo publicarlo o eliminarlo, sin que AI suspenda usuarios.
- Como superadmin quiero cambiar configuración comercial e integrar proveedores. **Aceptación:** configuraciones se validan y un adaptador de pagos nuevo no exige cambiar reglas del aula.

## 7. Requerimientos Funcionales

### 7.1 Descubrimiento, identidad y aula

Mostrar academia, catálogo, detalle, temario, modalidad, oferta y condiciones de membresía. Inicio de sesión y registro exclusivamente con Google. Separar permisos de alumno y superadmin. Aula con módulos ordenados, videos, materiales descargables, progreso y ruta recomendada. Una membresía activa cubre todos los cursos disponibles, sin inscripción pagada por curso.

### 7.2 Membresía y acceso

- Precio inicial: USD 20 por mes; mercado inicial: Perú. Superadmin configura precio, moneda y países habilitados.
- Renovación automática mensual mediante proveedor compatible.
- Cancelación desde cuenta: mantener acceso hasta terminar período pagado y detener renovaciones futuras.
- Renovación fallida: email de aviso y tres días de gracia con acceso; después suspender si no se confirma pago. Pago recuperado restablece acceso sin duplicar períodos.
- Mantener progreso e historial al perder acceso. Propuesta operativa para permitir retomar; su plazo de conservación queda por definir.
- Mostrar estado, próxima renovación o fecha de fin del acceso y acción para resolver pago cuando proveedor la permita.
- Política de cambios de precio para suscriptores existentes, reembolsos y contracargos: pendiente antes de producción; no aplicar aumentos retroactivos por defecto.

### 7.3 Encuentros

Encuentro semanal por curso, con fechas fijas configuradas por Grimi. Entrada sin reserva ni cupos para miembros con acceso. Calendario muestra horario y zona horaria; enlace de Google Meet visible dentro del curso. Recordatorio por email; anticipación pendiente de configuración. Grimi publica grabación posterior como contenido protegido. No se exige crear reuniones ni importar grabaciones automáticamente.

### 7.4 Consultas y moderación

Preguntas y respuestas guardadas por clase, visibles para todos los alumnos habilitados para esa clase. Alumnos pueden responder a otros; Grimi puede responder, ocultar contenido y suspender cuentas por abuso. No mostrar email del autor como dato público de las consultas.

AI revisa spam, insultos y posible exposición de datos sensibles. Sin señales detectadas: publicar. Con señales: retener para revisión de Grimi. Superadmin publica o elimina el contenido retenido. Sin suspensiones automáticas ni respuestas educativas automáticas. Si moderación falla, propuesta: dejar pendiente y permitir revisión manual, sin perder el mensaje. Registrar decisiones y evitar enviar datos innecesarios al servicio de AI.

### 7.5 Videos

Reproducción dentro del aula, sin descarga habilitada. Marca de agua con email del alumno que cambia de posición. Autorizar acceso a videos y grabaciones en servidor, con enlaces o credenciales de reproducción de duración limitada; no exponer archivos permanentes públicos. Material de estudio sí puede descargarse.

Límite explícito: estas medidas disuaden y dificultan copia; no garantizan impedir descarga, captura ni grabación de pantalla. Protección del proveedor de video y forma de aplicar marca de agua quedan como decisiones técnicas pendientes.

### 7.6 Pagos: contrato común y adaptadores

La academia controla membresía y derechos de acceso; cada adaptador traduce operaciones y eventos de su proveedor. El núcleo no depende de nombres de estados o formatos externos.

- Operaciones comunes: iniciar suscripción, consultar estado, cancelar renovación y obtener acción para actualizar medio de pago cuando corresponda.
- Eventos normalizados: pago confirmado, pago fallido, cancelación y cambios de suscripción. Vincularlos a usuario, proveedor, suscripción y período correspondientes.
- Verificar autenticidad de notificaciones; deduplicar eventos y tolerar reintentos, retrasos y llegada fuera de orden. Registrar conciliación y diferencias con proveedor.
- Catálogo de capacidades por adaptador: recurrencia, USD, país, cancelación al cierre y actualización de tarjeta. Rechazar configuraciones incompatibles antes de vender.
- Soportar registro de varios proveedores y asociación estable de cada suscripción con su proveedor original. Propuesta MVP: selección del proveedor para nuevas altas desde configuración; sin migración automática de suscripciones.
- No almacenar números de tarjeta ni códigos de seguridad; usar componentes o páginas de pago del proveedor.
- Cambiar proveedor activo no debe crear una segunda suscripción ni mover las existentes silenciosamente.

No existe compatibilidad universal sin integración: cada proveedor requiere adaptador y validación. Proveedor inicial pendiente. Capa común y simulación permiten desarrollo; cobros reales requieren al menos un adaptador productivo probado.

## 8. Requerimientos No Funcionales

- Interfaz responsive para celular y escritorio; controles accesibles por teclado y mensajes de estado claros.
- Verificación de acceso del lado servidor en contenido, videos, materiales y enlaces de encuentros.
- Protección de secretos, conexiones cifradas y permisos mínimos para integraciones.
- Auditar cambios comerciales, eventos de pago y acciones de moderación sin registrar datos de tarjeta ni secretos.
- Reintentos seguros para eventos y emails; fallos externos no deben borrar progreso ni consultas.
- Definir política de privacidad, conservación de datos y tratamiento de contenido por AI antes de lanzamiento.
- Metas numéricas de rendimiento, concurrencia y disponibilidad pendientes; no se inventan compromisos.

## 9. Arquitectura Técnica

Nota conceptual, sin stack decidido:

```text
Web pública / aula / panel de Grimi
                  ↓
Identidad + cursos + consultas + membresías y acceso
        ↓                 ↓                  ↓
Video protegido     Moderación AI       Contrato de pagos
Email y Meet        Revisión humana      Adaptador A / B / …
```

Google para identidad; Google Meet para encuentros. Proveedores de hosting, video, email, AI, base de datos y pagos pendientes. Mantener una sola regla interna de acceso por membresía, incluida gracia y cancelación.

## 10. Fases y Timeline

1. Revisar este PRD y resolver pendientes críticos; sesión separada de branding.
2. Diseñar y validar pantallas de catálogo, compra, aula y administración.
3. Construir experiencia central, membresías y contrato común de pagos con simulación.
4. Integrar proveedor real, video, emails y moderación; verificar recorridos completos.
5. Preparar contenido, ejecutar aceptación y lanzar en Perú.

Sin fechas comprometidas: estimar después de elegir proveedores y stack.

## 11. Criterios de Aceptación

1. Google autentica al alumno; usuario común no accede a administración.
2. Pago confirmado habilita todos los cursos disponibles; pago pendiente o rechazado de alta no concede acceso.
3. Cancelar desde cuenta impide nuevas renovaciones y mantiene acceso hasta vencimiento pagado.
4. Renovación fallida genera aviso; acceso continúa tres días y se suspende al terminar gracia si no hay recuperación.
5. Repetir un evento de pago no duplica membresía, cobro interno ni período; evento antiguo no revierte un estado posterior válido.
6. Al abrir otro módulo no hay bloqueo por orden; progreso guardado reaparece al volver a ingresar.
7. Un alumno ve consultas publicadas de la clase y puede responder; mensaje retenido no aparece públicamente antes de revisión.
8. Grimi puede resolver retenciones y suspender por abuso; AI no puede suspender cuentas.
9. Videos muestran marca de agua con identidad del espectador, sin descarga oficial; usuario sin acceso no obtiene reproducción válida.
10. Miembro habilitado ve calendario y Meet, recibe recordatorio y accede a grabación cuando Grimi la publica.
11. Curso de monetización aparece como próximo, sin acceso a clases inexistentes.
12. Un adaptador de prueba y un proveedor real elegido pasan el mismo contrato de pagos para capacidades requeridas antes del lanzamiento. Configuración incompatible se rechaza y suscripciones existentes conservan su proveedor.

## 12. Riesgos y Mitigaciones

- **Proveedor incompatible con recurrencia en USD o Perú:** validar capacidades y operación comercial antes de lanzar.
- **Copias de videos:** autorización de reproducción y marca de agua; comunicar límites sin prometer protección absoluta.
- **Falsos positivos o caída de AI:** revisión humana, mensajes pendientes y trazabilidad.
- **Eventos de cobro duplicados o demorados:** verificación, deduplicación y conciliación por período.
- **Configuración comercial inconsistente entre proveedores:** validar oferta y registrar proveedor por suscripción.
- **Carga operativa en una sola persona:** panel central y moderación asistida; no prometer tiempos de respuesta sin definirlos.

## 13. Métricas de Éxito

Medir conversión a membresía, miembros activos, renovaciones exitosas, cancelaciones, recuperación de pagos, avance por curso, asistencia a encuentros y tiempo de respuesta a consultas. Separar señales de AI de decisiones humanas. Metas cuantitativas pendientes de primera medición y revisión con Grimi.

## Pendientes para pasar a producción

Proveedor real de pagos y video; stack y hosting; proveedor de AI y email; política de cambios de precio, reembolsos y contracargos; conservación de datos; reglas de disponibilidad y medición de progreso; anticipación de recordatorios; horarios y materiales del curso; branding. Este borrador no presupone esas decisiones aprobadas.
