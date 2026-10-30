---
name: "arca-lpg-liquidaciones-recibidas"
description: "Consultá liquidaciones primarias de granos recibidas en ARCA por período, COE o CUIT emisor. Usar para LPG; no confundir con facturas recibidas de Mis Comprobantes ni emitir liquidaciones."
---

# Consultar liquidaciones primarias de granos recibidas

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Identificar las liquidaciones

El CUIT principal es el receptor consultado. `filters.cuit_emisor`, si se usa, es un filtro distinto y debe ser texto de 11 dígitos. No lo reemplaces por el `username` de quien inicia sesión.

`filters` es opcional. Admite `fecha_desde`, `fecha_hasta`, `coe` y `cuit_emisor`. Las fechas usan `dd/mm/yyyy` o `yyyy-mm-dd`; mantené el mismo formato y un rango válido. `coe` es texto: preservá el identificador entregado por el usuario sin transformarlo en un CAE ni inferirlo de un número de factura.

Resolvé períodos relativos con fechas concretas y comunicá el alcance. Esta variante no tiene tipos de comprobante, punto de venta, `page`, `cursor` ni `limit`; no copies filtros de Mis Comprobantes. Si un filtro indispensable no está disponible, indicá la limitación antes de afirmar que la consulta lo aplicó.

## Entregar

Resumí identidades, emisores, fechas y montos únicamente si el resultado los incluye. No asumas que un COE faltante significa rechazo ni calcules obligaciones impositivas que no fueron solicitadas. No emitas, anules o modifiques liquidaciones. Si la respuesta no permite verificar cobertura completa, explicitá que el resumen se limita a lo devuelto.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_lpg_liquidaciones_recibidas` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
