---
name: "arca-mis-retenciones"
description: "Consultá retenciones o percepciones de ARCA con Mis Retenciones, incluyendo Ganancias y Bienes Personales, por filtros o presets y con páginas. No presentar declaraciones ni solicitar devoluciones."
---

# Consultar retenciones y percepciones

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Definir la consulta y las páginas

Son obligatorios `mode`, `page` y `size`, además de CUIT y usuario. Empezá en `page=0`; `size` es un entero positivo y debe ser acotado al volumen solicitado, no un supuesto máximo del proveedor.

- En `mode="preset"`, seleccioná sólo el preset correspondiente: `percepcion-ganancias`, `percepcion-bienes-personales` o `retencion-ganancias`.
- En `mode="filter"`, construí `filters` con los criterios pedidos. Las fechas `fechaRetencionDesde` y `fechaRetencionHasta` usan `YYYY-MM-DD`. `percepciones` y `retenciones` son booleanos; `impuestoRetenido` es entero. No inventes códigos de impuesto ni combines filtros contradictorios.
- Para otra página, creá una consulta nueva del mismo modo y filtros, cambiando sólo `page`. Esto solicita nuevos datos; no es el mecanismo para seguir una operación pendiente. Primero obtené el resultado de cada ID.
- Seguí las indicaciones reales de cantidad/páginas si la respuesta las incluye. No inventes nombres de campos ni un total. Si la respuesta no permite demostrar el final, describí qué páginas consultaste y marcá el resultado como parcial.

## Entregar

Diferenciá retenciones de percepciones y agrupá únicamente por los impuestos/agentes que realmente devuelve ARCA. No presentes los importes como saldo disponible para devolución ni como una declaración ya realizada.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_mis_retenciones` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
