---
name: "arca-monotributo-info"
description: "Consultá la información de monotributo de un CUIT en ARCA y explicá los vencimientos que el resultado realmente informe. No inventar fechas, recategorizar, adherir ni pagar obligaciones."
---

# Consultar información de monotributo

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Obtener la información disponible

Esta automatización sólo admite `cuit` y `username`; no agregues período, categoría, una fecha deseada ni filtros de vencimiento. Consultar el estado del monotributo no equivale a recategorizar, efectuar una adhesión o generar un pago.

Para una pregunta como «cuándo vence», inspeccioná el resultado completo antes de responder. Usá únicamente el concepto, período y fecha efectivamente devueltos. Si hay varios vencimientos, diferenciá sus obligaciones; si sólo hay datos de inscripción o categoría, informá que esta respuesta no contiene el vencimiento solicitado. Nunca completes una fecha con un día fijo del mes, memoria general o la fecha de otro período.

Si el usuario también solicita deudas, pagos o intereses y esta respuesta no los contiene, ofrecé una consulta separada de CCMA dentro del alcance que autorice. No llames CCMA ni otros servicios para ampliar una consulta ya satisfecha.

## Entregar

Resumí categoría, condición, importes y fechas únicamente cuando existan en la respuesta. Identificá el CUIT consultado y la fecha de consulta; no presentes la ausencia de datos como deuda cero o baja del régimen. No hay paginado ni historial de períodos configurable en esta variante.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_monotributo_info` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
