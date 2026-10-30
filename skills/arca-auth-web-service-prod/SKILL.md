---
name: "arca-auth-web-service-prod"
description: "Autorizar un web service de producción de ARCA a un certificado existente, propio o delegado, con Afip SDK. No reemplaza crear ni aceptar una delegación."
---

# Autorizar un web service en producción

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Autorización concreta

Leé [el esquema de entrada](references/input-schema.json). Usá `automations_auth_web_service_prod` con `cuit`, `username`, `alias` y `service`. El alias sólo admite letras ASCII y números; el servicio exige su ID ARCA, como `wsfe` para Facturación Electrónica, no una etiqueta inventada.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Si se trata de un servicio delegado, agregá `delegated_from` como cadena de 11 dígitos con el CUIT **que delegó** el servicio. No lo sustituyas por `username` ni por el CUIT receptor. Si no hay delegación, omitilo. No crees ni aceptes una delegación como paso implícito para resolver un error.

Comprobá que el usuario autorizó la combinación de CUIT, certificado, servicio y **producción**. Si ya es explícita, no repitas la aprobación; si está incompleta, resolvela antes de llamar. Autorizar el servicio no equivale a emitir una factura ni a conceder acceso a todos los servicios. Informá únicamente la vinculación que confirme el resultado.

## Ejecución y seguimiento

Enviá una única llamada a `automations_auth_web_service_prod` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
