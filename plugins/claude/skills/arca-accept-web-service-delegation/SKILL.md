---
name: "arca-accept-web-service-delegation"
description: "Aceptar una delegación de web service ARCA recibida de otro CUIT mediante Afip SDK. No usar para otorgarla ni para vincular todavía el servicio a un certificado."
---

# Aceptar una delegación de web service

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Aceptación de la delegación recibida

Leé [el esquema de entrada](references/input-schema.json). Usá `automations_accept_web_service_delegation` con `cuit`, `username`, `service` y `delegated_cuit`.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

`cuit` corresponde a quien **acepta/recibe** el servicio; `delegated_cuit` es el CUIT **que le delegó** ese servicio, entero de 11 dígitos. La descripción corta del catálogo puede ser ambigua: no interpretes `delegated_cuit` como el receptor ni lo intercambies con `cuit`. `username` es el login autorizado para actuar por quien acepta. Si el usuario dio dos CUIT sin sus roles, preguntá cuál otorga y cuál acepta antes de ejecutar.

`service` necesita el ID exacto de web service reconocido por ARCA. La autorización del usuario debe cubrir aceptar esa delegación concreta, no cualquier delegación pendiente. No otorgues una delegación nueva si no encontrás la esperada ni cambies al CUIT opuesto por un error.

Aceptar no vincula por sí solo el servicio al certificado. Esa autorización posterior, si se solicita, requiere el alias y el flujo `automations_auth_web_service_prod` con el CUIT de origen en `delegated_from`; no la ejecutes por defecto. No crees un certificado ni un emisor como consecuencia automática.

Informá la aceptación confirmada, las identidades y el ID del trabajo, sin afirmar que el certificado ya puede usar el servicio si ese paso no se realizó.

## Ejecución y seguimiento

Enviá una única llamada a `automations_accept_web_service_delegation` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
