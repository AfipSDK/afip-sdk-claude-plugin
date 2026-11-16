---
name: "arca-add-relation"
description: "Habilitar un servicio de ARCA mediante una relación con un CUIT usuario designado. Usar para agregar la relación, no para consultar datos fiscales ni autorizar un certificado."
---

# Agregar una relación para un servicio de ARCA

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Relación solicitada

Leé [el esquema de entrada](references/input-schema.json). Usá `automations_add_relation` con `cuit`, `username`, `service` y `delegate_to`.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

`cuit` identifica al contribuyente por el que se habilita el servicio; `delegate_to` es el CUIT que **va a usarlo**, entero de 11 dígitos. Puede coincidir con el contribuyente si ése es el alcance pedido, pero no lo supongas. `username` sigue siendo el usuario real del login, no necesariamente ninguno de esos dos.

Solicitá el identificador del servicio si sólo se conoce un nombre ambiguo. `service` es un ID de servicio a habilitar: esta acción no está restringida al mismo conjunto de web services de `automations_auth_web_service_prod`. No conviertas nombres a códigos inventados ni uses otra automatización por semejanza del título.

Agregar una relación modifica permisos en ARCA. Comprobá que el pedido autoriza el servicio y el CUIT que lo utilizará; no repitas una confirmación si ya son inequívocos. No agregues relaciones amplias o extras para resolver un error de acceso.

La relación no demuestra por sí sola una autorización de certificado, una delegación aceptada o la ejecución del servicio. Informá únicamente el alta y los datos efectivamente confirmados; cualquier consulta o mutación posterior debe corresponder al objetivo pedido y disponer de su herramienta.

## Ejecución y seguimiento

Enviá una única llamada a `automations_add_relation` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
