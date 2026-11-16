---
name: "arca-cai-cancel"
description: "Validar si se puede anular o anular un CAI de ARCA identificado por sus 14 dígitos. No usar para cancelar una factura electrónica aprobada ni una emisión en cola."
---

# Anular un CAI

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Alcance de la anulación

Leé [el esquema de entrada](references/input-schema.json). La llamada es `automations_cai_cancel` con `cuit`, `username`, `cai` como cadena de **14 dígitos** y `validateOnly`. No cambies el código ni pierdas ceros iniciales por convertirlo a número.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Si preguntan si se puede anular, ejecutá únicamente `validateOnly: true`. La validación no autoriza una anulación posterior. Si piden anular, confirmá que el alcance conocido incluye el CUIT y el CAI exacto, y que la anulación es irreversible; resolvé cualquier ambigüedad antes de enviar `validateOnly: false`, sin repetir aprobaciones ya inequívocas.

Interpretá el resultado concreto: `cancellable` indica elegibilidad, no anulación; `cancelled` o `already_cancelled` indican el estado confirmado. No prometas que la anulación será permitida: ARCA evalúa las condiciones del CAI. No intentes eludir un rechazo ni cambies a otro CAI.

Esta acción no anula una factura electrónica con CAE ni equivale a `invoices_cancel`. Para una factura aprobada el ajuste es otro flujo, normalmente una nota de crédito; no lo ejecutes como sustitución implícita.

Ante resultado ambiguo, consultá primero el mismo trabajo. Si no permite confirmar el estado, pedí comprobarlo en ARCA antes de una nueva anulación: el plugin no ofrece una consulta genérica de CAI que puedas inventar.

## Ejecución y seguimiento

Enviá una única llamada a `automations_cai_cancel` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
