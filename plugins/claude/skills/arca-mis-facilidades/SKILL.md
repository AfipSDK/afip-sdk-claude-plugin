---
name: "arca-mis-facilidades"
description: "Consultá planes de pago, cuotas y situación devueltos por Mis Facilidades de ARCA. Usar para revisar planes existentes; no para adherir, modificar, cancelar o pagar un plan."
---

# Consultar planes en Mis Facilidades

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Acotar planes existentes

`filters` es opcional. Podés seleccionar `tipo_plan`, `situacion`, `estado_envio` y fechas de presentación. No supongas códigos de situación o tipo: usá los valores conocidos por el usuario o consultá sin ese filtro.

Las fechas `fecha_presentacion_desde` y `fecha_presentacion_hasta` admiten `dd/mm/yyyy` o `yyyy-mm-dd`; usá un único formato coherente. Explicá que delimitan presentación del plan, no vencimiento de sus cuotas.

Para ordenar, `order_by` acepta `fecha_presentacion`, `numero_presentacion`, `cantidad_total_cuotas`, `cuotas_pagas`, `cuotas_impagas`, `presentacion`, `tipo_plan`, `total_consolidado`, `estado_envio` o `situacion`; `order_direction` acepta `asc`, `desc`, `A` o `D`. Omití el orden si no aporta a la consulta. Esta variante no recibe página ni cursor.

## Entregar

Presentá número/identidad del plan, situación y cuotas o importes sólo si aparecen en la respuesta. Diferenciá un dato no devuelto de un valor cero. No calcules próximos débitos, intereses o caducidad como hechos si no los informa el resultado. Consultar un plan no paga una cuota ni cambia su estado.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_mis_facilidades` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
