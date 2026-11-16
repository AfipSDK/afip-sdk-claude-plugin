---
name: "arca-accept-service-delegation"
description: "Acepta una delegación pendiente de un servicio web o web service"
---

# Aceptar una delegación de servicio

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` en la conexión correspondiente. No crees otra operación ni exijas una credencial guardada para leer su estado.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si corresponde a Factura SDK, indicá conectar el proyecto adecuado; no cambies de producto ni uses otra herramienta como sustituto.

Distinguí `cuit` (CUIT representado que recibe y acepta el servicio) de `username` (CUIT de quien inicia sesión en ARCA). Pueden ser distintos. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar. No pidas contraseñas, tokens ni claves privadas en el chat ni los incluyas en los argumentos.

## Delegación concreta

Leé [el esquema de entrada](references/input-schema.json). Usá `automations_accept_service_delegation` con `cuit`, `username`, `service` y `delegated_cuit` directamente, sin contenedores `automation` ni `params`.

`delegated_cuit` identifica a quien **delegó** el servicio, no a quien lo recibe. Tanto ese CUIT como `cuit` admiten entero o texto de 11 dígitos; `username` es texto de 11 dígitos. Si los roles no están claros, aclaralos antes de ejecutar.

`service` es el ID completo y literal de ARCA, incluido su esquema: `web://mcmp` para Mis Comprobantes o `ws://wsfe` para ese web service. No antepongas `ws://`, no retires el esquema ni conviertas un ID en otro. La autorización del usuario debe cubrir la delegación concreta y sus dos CUIT; no aceptes otras relaciones pendientes. Esta operación no crea la delegación inicial ni autoriza un certificado.

## Ejecución y resultado

Enviá una única llamada a `automations_accept_service_delegation`. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir uso. Conservá `data.id` y consultá `automations_get({id})` con `automations:read`, mediante consultas acotadas. El `status` de la envoltura MCP es HTTP; el trabajo usa `data.status`: `in_process`, `complete` o `error`. Sólo al completar interpretá el resultado interno de `data.data`.

`status: accepted` confirma la aceptación; `status: not_exists` con `message` indica que no se encontró esa delegación pendiente, no que se la haya aceptado ni que el certificado esté autorizado. Informá el resultado y el ID del trabajo sin crear, delegar o autorizar nada adicional.

Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente. Si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué falta verificar: no hay clave de idempotencia para el inicio. No presentes HTTP 200, creación del trabajo o resultados parciales como aceptación confirmada.
