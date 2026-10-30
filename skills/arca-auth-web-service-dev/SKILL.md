---
name: "arca-auth-web-service-dev"
description: "Autorizar un web service para un certificado de homologación de ARCA mediante Afip SDK. Usar para habilitar un servicio a un alias existente, no para emitir ni crear certificados."
---

# Autorizar un web service en homologación

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Autorización concreta

Leé [el esquema de entrada](references/input-schema.json) antes de preparar `automations_auth_web_service_dev`. Reuní `cuit`, `username`, `alias` y `service`. El alias existente sólo admite letras ASCII y números; `service` debe ser un ID de web service reconocido por ARCA, no su nombre visible. `wsfe` identifica Facturación Electrónica; no lo elijas si el usuario pidió otro servicio.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Explicitá CUIT, alias, servicio y **homologación de ARCA** antes de modificar la autorización. Si la solicitud ya autoriza inequívocamente esa combinación, procedé; preguntá sólo por datos o alcance faltantes. Homologación usa ARCA real y no es el sandbox simulado `dev` de Factura SDK.

Esta operación vincula el servicio al certificado: no crea un certificado, no otorga una delegación entre CUIT ni emite comprobantes. No ejecutes esos pasos adicionales sin que formen parte del pedido.

## Ejecución y seguimiento

Enviá una única llamada a `automations_auth_web_service_dev` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
