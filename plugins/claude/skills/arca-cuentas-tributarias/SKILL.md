---
name: "arca-cuentas-tributarias"
description: "Consultá información de Cuentas Tributarias de ARCA por CUIT, períodos e impuesto. Usar para revisar lo informado por ese servicio; no confundir con CCMA ni presentar declaraciones o pagos."
---

# Consultar el Sistema de Cuentas Tributarias

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Delimitar el servicio y el período

La herramienta `automations_cuentas_tributarias` no es CCMA. Si el pedido es específicamente de la cuenta corriente de monotributo/autónomos, no lo redirijas a este servicio sólo porque también menciona deudas; aclaralo o usá la consulta correspondiente al objetivo.

Los filtros son opcionales: `periodoDesde` y `periodoHasta` usan `MM/YYYY`; `impuesto` es texto. No inventes un catálogo de códigos de impuesto ni envíes un nombre libre que el servicio pueda interpretar de otro modo. Si el código no está resuelto, pedí ese dato o consultá sin ese filtro cuando el alcance lo permita.

Validá que el período inicial no sea posterior al final. No agregues `fechaCalculo`, filtros de CCMA o paginado: no están en este contrato. Si el usuario solicita sólo un período, delimitá el rango de manera coherente y dejá ese alcance visible.

## Entregar

Presentá los conceptos, períodos, movimientos y saldos realmente devueltos; no asumas una estructura fija. Indicá si el filtro o los datos no permiten establecer un total completo. Una consulta vacía no prueba que no existan otras obligaciones. No generes pagos, compensaciones o declaraciones como parte de esta consulta.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_cuentas_tributarias` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
