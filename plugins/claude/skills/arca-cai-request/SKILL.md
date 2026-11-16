---
name: "arca-cai-request"
description: "Solicitar o validar un Código de Autorización de Impresión (CAI) de ARCA para lotes de comprobantes. No usar para emitir facturas electrónicas con CAE."
---

# Solicitar un CAI

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Solicitud o validación

Leé [el esquema de entrada](references/input-schema.json). Usá `automations_cai_request` con `cuit`, `username` y una lista no vacía `comprobantes`. Cada lote requiere `puntoVenta` (entero positivo de hasta 5 dígitos), `tipoComprobante` (código ARCA de hasta 3 dígitos) y `cantidad` (hasta 8 dígitos). No confundas CAI de impresión con CAE de una factura electrónica.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Si `resguardo` es `true`, cada lote debe indicar `puntosVentaResguardo`. El contrato MCP exige cadenas: enviá números como cadenas de dígitos, positivos y de hasta 4 dígitos. No envíes números JSON en ese arreglo. `autorizados` admite como máximo **3 personas**, con `documento` de sólo dígitos, `denominacion` y, si corresponde, `tipoDocumento` permitido por el esquema. El controlador impone ese máximo aunque el esquema general permita más elementos.

Indicá `validateOnly: true` si el usuario pidió sólo validar o previsualizar; no continúes automáticamente con una emisión. Para solicitar el CAI real, usá `validateOnly: false` sólo con autorización que cubra CUIT, lotes, cantidades y resguardo. Si ya están autorizados, no agregues otra confirmación.

Un resultado de validación no prueba que exista un CAI. Mostrá código, vencimiento y solicitud sólo cuando vengan en el resultado; no calcules un vencimiento ni asumas que los comprobantes ya fueron impresos o recibidos.

## Ejecución y seguimiento

Enviá una única llamada a `automations_cai_request` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
