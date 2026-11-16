---
name: "arca-delegate-web-service"
description: "Delegar a otro CUIT el uso de un web service de ARCA con Afip SDK. No usar para aceptar la delegación ni autorizar un certificado."
---

# Delegar un web service a otro CUIT

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Identidad y servicio delegado

Leé [el esquema de entrada](references/input-schema.json). Usá `automations_delegate_web_service` con `cuit`, `username`, `service` y `delegate_to`.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

`cuit` es el contribuyente que **otorga** la delegación; `delegate_to` es el CUIT **receptor**, entero de 11 dígitos. `username` identifica el login con permisos para actuar por el otorgante. No intercambies esos tres roles. `service` requiere un ID de web service ARCA reconocido, como `wsfe`, no el nombre libre mostrado en una pantalla.

La mutación concede acceso a otro contribuyente. Asegurá autorización expresa para esa dirección, servicio y CUIT receptor antes de enviarla; si el usuario ya los indicó y pidió delegar, no repitas la aprobación. Si falta un dato, resolvelo sin suponer que el receptor es el usuario conectado.

Una delegación creada no equivale a haberla aceptado ni vinculado a un certificado. No encadenes `automations_accept_web_service_delegation` ni `automations_auth_web_service_prod` sin que formen parte del objetivo autorizado; podrían requerir otra identidad y credencial. Tampoco concede todos los servicios ni guarda un emisor de Factura SDK.

Al concluir, resumí quién delegó, a quién y qué servicio, con el ID de seguimiento. Distinguí el éxito de este paso de cualquier aceptación posterior pendiente.

## Ejecución y seguimiento

Enviá una única llamada a `automations_delegate_web_service` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
