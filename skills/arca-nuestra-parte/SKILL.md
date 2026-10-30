---
name: "arca-nuestra-parte"
description: "Consultá información disponible en Nuestra Parte de ARCA para un CUIT y año. Usar para revisar datos informados; no equipararlos a una declaración presentada ni calcular impuestos definitivos."
---

# Consultar Nuestra Parte de ARCA

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Elegir el período

`periodo` es obligatorio y se envía como texto de cuatro caracteres con el año solicitado. No uses `MM/YYYY`, una fecha completa ni un rango: la variante recibe un año por consulta. Si el usuario no indicó año y no puede resolverse del contexto, pedilo antes de crear la automatización.

Para comparar varios años expresamente solicitados, ejecutá una consulta por año y conservá cada ID por separado. Obtené el resultado de cada operación con `automations_get`; no confundas un segundo año con un reintento del primero. Si el pedido no autoriza años adicionales, no amplíes la consulta para completar categorías que no aparecen.

Sólo se admiten `cuit`, `username` y `periodo`. No agregues filtros de patrimonio, ingresos o paginado ni supongas categorías fijas en la respuesta.

## Entregar

Agrupá los datos según las categorías que realmente devuelva ARCA, señalando el año y las ausencias relevantes. Diferenciá la información disponible en Nuestra Parte de ingresos declarados, bases imponibles o impuestos liquidados: no son equivalentes por sí mismos. No inventes movimientos ni completes importes faltantes con cero. Una comparación debe identificar los años consultados y cualquier resultado incompleto, sin afirmar exhaustividad del patrimonio o actividad del contribuyente.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_nuestra_parte` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
