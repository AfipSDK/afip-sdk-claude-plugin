---
name: "arca-mis-comprobantes"
description: "Consultá comprobantes recibidos o emitidos registrados en Mis Comprobantes de ARCA, por CUIT y período. Usar para facturas que te emitieron; no para emitir comprobantes ni limitar la consulta al historial de Factura SDK."
---

# Consultar comprobantes de ARCA

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Definir la consulta

- Usá `filters.t="R"` para comprobantes recibidos: son los que otros emitieron al CUIT consultado. Usá `"E"` para emitidos. No sustituyas esta consulta por `invoices_list`, cuyo alcance es Factura SDK.
- `filters.fechaEmision` es obligatorio y usa `dd/mm/yyyy - dd/mm/yyyy`, con espacios alrededor del guion. Para «este mes», resolvé las fechas en la zona horaria pertinente y explicitá el intervalo; no inventes un período si la fecha actual no está disponible.
- Los filtros opcionales incluyen rangos de número, tipo/número de documento y código de autorización. Aplicá sólo los solicitados y con el tipo exacto del esquema.
- Hay una incompatibilidad conocida: el esquema MCP declara `puntosVenta` y `tiposComprobantes` como texto, pero el controlador requiere listas. No envíes esos filtros ni inventes una codificación. Podés filtrar el resultado después únicamente si comprobás que está completo; si no, explicá la limitación y no lo presentes como búsqueda exhaustiva.

## Entregar

Separá recibidos de emitidos y mantené identificadores y montos tal como vienen. No mezcles monedas ni cuentes notas de crédito como facturas positivas sin una interpretación explícita. No hay parámetros de página en esta variante: no inventes `page`, `cursor` o `limit`; advertí cualquier truncamiento o cobertura no verificable.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_mis_comprobantes` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
