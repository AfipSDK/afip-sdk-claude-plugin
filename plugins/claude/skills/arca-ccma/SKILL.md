---
name: "arca-ccma"
description: "Consultá CCMA de ARCA para revisar períodos, pagos, saldos e intereses de monotributo, autónomos o servicio doméstico según los datos devueltos. No pagar ni reimputar conceptos."
---

# Consultar la cuenta corriente CCMA

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Preparar la consulta

`periodoDesde` y `periodoHasta` son opcionales y usan `MM/YYYY`; `fechaCalculo`, también opcional, usa `DD/MM/YYYY`. No confundas el rango de períodos con la fecha a la que se calcula la información. Si el pedido depende de intereses a una fecha específica, obtené esa fecha del usuario o explicitá la fecha usada; no calcules intereses por tu cuenta como sustituto de ARCA.

`tipoContribuyente` admite `Todos`, `Autonomo`, `Monotributo` o `Serv. Doméstico`. `impuesto` admite `Todos`, `020` o `AUT`. Preservá esos valores exactos, sin traducirlos ni inventar otros. No elijas un impuesto sólo por adivinar la condición del CUIT; omití un filtro opcional si no está definido.

Usá un rango válido y explicá el intervalo antes de consultar cuando un pedido relativo necesite resolución. No agregues campos de paginado: esta variante no los ofrece.

## Entregar

Diferenciá capital, intereses, pagos y saldo solamente cuando la respuesta distinga esos conceptos. Conservá los signos y la fecha de cálculo: no conviertas automáticamente un importe negativo en deuda. No declares un libre deuda si faltan períodos o el resultado es parcial. La consulta no efectúa pagos, compensaciones ni reimputaciones.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_ccma` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
