---
name: "gestionar-webhooks"
description: "Consultar y editar endpoints webhook existentes, enviar una prueba solicitada y diagnosticar sus entregas. No permite crear o borrar endpoints, rotar secretos ni reenviar eventos anteriores."
---

# Gestionar webhooks

## Conexión y capacidades

Usá el MCP `afipsdk` en el proyecto autorizado de **Factura SDK**: `project_current` debe devolver `product: facturasdk`. Los endpoints pertenecen al proyecto y ambiente de la conexión. Ni `project_current` ni el detalle del endpoint por MCP informan el ambiente; comprobalo en el contexto de conexión antes de modificarlo y, si no está claro, resolvelo con el usuario. Dev simula la facturación, pero **una prueba webhook envía una petición HTTP real al destino**.

Leé [los contratos disponibles](references/tools.json). Este flujo sólo permite listar, obtener, editar y probar endpoints existentes, y consultar sus entregas. No hay herramientas de creación, borrado, rotación de secretos ni replay; no inventes nombres ni uses otra vía para ampliar el pedido. Las lecturas requieren `webhooks:read`; editar y probar requieren `webhooks:write`, acceso de escritura y suscripción activa. Si faltan permisos, informá el bloqueo sin intentar eludirlo.

## Identificar y diagnosticar

Usá `webhooks_list` con `status: active|inactive` si corresponde y `webhooks_get({id})` para verificar el endpoint exacto, URL y estado dentro del ambiente conectado. No confundas el ID del endpoint con el de una entrega o comprobante. Si hay varios candidatos, resolvé el destino antes de mutar. Los secretos no se devuelven: no los pidas ni los infieras.

Consultá `webhooks_deliveries({id, status?, invoice_id?, cursor?, limit?})` para el endpoint elegido. `status` acepta `pending`, `delivered` o `failed`; `invoice_id` es el ID interno del comprobante. Listados y entregas están paginados, más recientes primero, hasta 100 por página: seguí `next_cursor` sin alterarlo ni cambiar filtros cuando el alcance lo requiera. Indicá si revisaste sólo parte y no conviertas una página vacía o parcial en un diagnóstico de todo el historial.

Leé el resultado de negocio dentro de `data`, no el `status` HTTP de la envoltura MCP. Para el diagnóstico, vinculá entrega, `event_type`, `invoice_id`, `http_status`, `attempts`, `last_error`, `next_retry_at` y fechas efectivamente devueltas:

- `delivered` significa que el receptor respondió **HTTP 2xx**. No prueba que haya validado la firma, persistido el evento o completado su proceso de negocio.
- `pending` significa entrega pendiente, posiblemente con reintento programado; no fracaso definitivo. No prometas la hora exacta de entrega por ver `next_retry_at`.
- `failed` significa fallo de esa entrega, no rechazo ni cancelación del comprobante. Los reintentos automáticos de eventos ordinarios son acotados; las pruebas no se reintentan automáticamente. Un endpoint desactivado también puede hacer fallar entregas pendientes.

Un webhook es una notificación. Para confirmar el resultado fiscal actual, usá el flujo `consultar-comprobantes`; no lo deduzcas del éxito o fallo del transporte. Mostrá errores y fragmentos relevantes con credenciales y datos sensibles redactados, no vuelques payloads completos innecesarios.

## Editar un endpoint existente

`webhooks_edit` acepta `id` y sólo los cambios `url` y/o `status: active|inactive`; enviá al menos un campo a modificar. El ambiente no se puede cambiar. La URL debe ser pública, HTTP(S), **HTTPS en prod**, sin usuario/contraseña embebidos.

Antes de aplicar, dejá concretos endpoint, ambiente, valor anterior y cambio autorizado. No repitas una aprobación ya explícita sobre ese mismo cambio. Sólo puede haber un endpoint activo por ambiente y la URL no puede duplicar otro endpoint del mismo ambiente. Ante conflicto, informá el endpoint conflictivo; no desactives otro silenciosamente para resolverlo.

Desactivar detiene nuevos eventos y hace fallar las entregas pendientes en el siguiente barrido; no es borrar el endpoint. Activar no reproduce automáticamente eventos previos. Tras editar, comprobá la configuración devuelta; ante timeout, releé con `webhooks_get` antes de decidir si hace falta repetir el cambio. No cambies la URL a un destino propio para depurar.

## Enviar una prueba

Usá `webhooks_test({id})` sólo cuando enviar la prueba a ese endpoint y ambiente esté dentro del pedido autorizado; un diagnóstico de sólo lectura no lo autoriza. La herramienta envía un evento firmado `test`, crea una entrega y realiza **un único intento**, sin emitir comprobantes ni reenviar eventos fiscales anteriores.

Informá `data.delivered`, `data.http_status`, `data.error` y la entrega devuelta. Un HTTP 200 de la herramienta no equivale a `delivered: true`. Ante timeout o resultado incierto, buscá primero la entrega de prueba con `webhooks_deliveries`; no repitas automáticamente una acción que puede duplicar efectos en el receptor. Si no podés identificarla con certeza, informá la incertidumbre y detené la prueba.
