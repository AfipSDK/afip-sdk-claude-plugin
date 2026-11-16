---
name: "arca-list-sales-points"
description: "Listá los puntos de venta registrados en ARCA para un CUIT y revisá sus datos disponibles. Usar para consultar o elegir uno existente; no para dar de alta puntos de venta ni activar emisores."
---

# Consultar puntos de venta de ARCA

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y datos

Usá el MCP `afipsdk`: `project_current` debe identificar el proyecto autorizado de Web Services y Automatizaciones (`product=afipsdk`). Si está conectado Factura SDK o falta la herramienta/permisos, pedí reconectar al proyecto adecuado; no cambies el proyecto mediante parámetros. Estas consultas usan ARCA real, no el sandbox de Factura SDK.

Identificá `cuit` representado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos): pueden ser distintos. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto; nunca pidas contraseña, tokens o claves en el chat ni los agregues a los argumentos.

## Consultar sin modificar

Esta variante requiere únicamente `cuit` y `username`. No admite filtros por número, sistema, ambiente o estado, ni parámetros de página. Si el usuario busca un punto concreto, consultá la lista y compará el número devuelto; no inventes un filtro de entrada.

El CUIT representado puede tener varios puntos de venta y sistemas. Mostrá los números y los atributos disponibles sin inventar etiquetas, estados o compatibilidades que no estén en el resultado. Si el usuario quiere facturar con uno, no elijas automáticamente el primer registro ni des por verificado un emisor: esta consulta no autoriza ni activa la emisión.

Si faltan puntos esperados, distinguí entre lista vacía, resultado parcial y error de acceso. No crees otro punto como solución a una consulta fallida. Una alta es otra acción y requiere su propio alcance.

## Entregar

Resumí CUIT consultado, puntos encontrados y cualquier limitación. Si hay campos de sistema o estado, conservalos como datos de ARCA; si faltan, indicá «no informado». La variante no expone paginado: no agregues `page`, `cursor` ni `limit`, ni asegures una enumeración completa cuando el proveedor señale truncamiento.

## Ejecutar y seguir

Revisá [el esquema de entrada](references/input-schema.json), copiado de esta herramienta MCP, antes de formar los argumentos. Llamá `automations_list_sales_points` con los argumentos validados. No agregues campos ajenos al esquema.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Leé el contenido estructurado MCP `{status, data}`: el estado HTTP externo no es el estado de la operación. Guardá `data.id`; consultá `automations_get({id})` hasta `data.status="complete"` o `"error"`, con seguimiento acotado. `in_process` no es éxito; el resultado está en el `data` interno. Si falta el resultado, está vencido o el seguimiento no termina, comunicá esa limitación y el ID. No recrees una operación para esperar: esta herramienta no admite claves de idempotencia ni de reintento. Ante un error, conservá el diagnóstico saneado y no repitas automáticamente un envío de resultado incierto.
