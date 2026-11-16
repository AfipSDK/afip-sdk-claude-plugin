---
name: "gestionar-certificados"
description: "Consultar, crear, asignar, autorizar para wsfe o revocar localmente certificados de facturación. Usar para administrar certificados guardados; no para descargar claves ni renovar por MCP."
---

# Gestionar certificados

Si ya hay un `automation_id` y sólo se pide consultar o retomar su seguimiento, usá `automations_get({id})` en la conexión correspondiente. No exijas una credencial para consultar ni repitas la creación. El ID de un trabajo no es un `certificate_id`; un resultado inaccesible no autoriza crear un certificado nuevo.

## Conexión y alcance

Usá el MCP `afipsdk` con un proyecto **Factura SDK** (`product: facturasdk`). Identificá el proyecto con `project_current`; el entorno `dev` o `prod` viene de la conexión autorizada, no de la respuesta de esa herramienta. No agregues un argumento `environment` ni cambies de entorno para evitar errores. Si falta conocerlo antes de una mutación, aclaralo. `dev` simula certificados y autorizaciones; no es homologación de ARCA.

Leé [las herramientas y esquemas disponibles](references/tools.json) antes de construir los argumentos. Esta skill administra registros del proyecto, no los trámites genéricos de creación de certificados del producto Afip SDK / Web Services y Automatizaciones. No cambies de producto como sustituto de una operación no disponible.

No solicites ni copies claves fiscales, tokens, PEM o claves privadas en el chat. Para una automatización nueva, consultá `arca_credentials_list({cuit: username})`: `username` es el CUIT de **inicio de sesión** en ARCA, como cadena de 11 dígitos, no necesariamente el CUIT dueño del certificado. La credencial debe estar guardada en el mismo proyecto y entorno. Si falta o es incorrecta, indicá guardarla o corregirla en Configuración → Credenciales de ARCA y después retomar. Las credenciales de `dev` son simuladas.

Asegurá que la solicitud cubra la mutación concreta, el certificado/CUIT, las asignaciones y el entorno. Consultar un vencimiento no autoriza crear, reemplazar o revocar. Cuando ese alcance ya esté autorizado, ejecutá sin pedir otra confirmación equivalente.

## Consultar y seleccionar

- `certificates_list` admite `tax_id`, `search` (CUIT completo o parcial), `status` (`active`, `revoked`, `expired`), `cursor` y `limit` (1–100). Mantené los filtros al seguir `next_cursor`; el total y la página están en `total_count` y `data` de la respuesta de la API.
- `certificates_get({id})` recupera los metadatos de un certificado concreto: CUIT, alias, origen, serial, expiración y estado. No devuelve PEM ni clave privada. No prometas descargas de ese material ni busques eludir la redacción del MCP.
- Usá el ID interno devuelto, no un alias, CUIT ni ID de automatización. No elijas arbitrariamente entre varios resultados de una búsqueda parcial. Comprobá estado y `expiration`: un registro marcado `active` puede tener una fecha ya vencida y no ser utilizable para firmar.
- Un 404 puede deberse a un ID incorrecto o a que no pertenece al proyecto/entorno de la conexión; no implica que haya que recrearlo. Un error de permisos se resuelve con la conexión o permisos adecuados, no con otra herramienta que amplíe el alcance.

## Crear en el proyecto o crear y asignar

Elegí una sola de estas operaciones según el resultado solicitado:

- **Agregar al conjunto de certificados:** `certificates_create({tax_id, username, alias?})`. Aunque el esquema sólo marca `username` como requerido, el controlador exige también `tax_id`, el CUIT dueño del certificado como entero de 11 dígitos. No lo infieras del login. Esta operación crea, autoriza para `wsfe` y guarda el certificado, pero no lo asigna a emisores.
- **Crear para un emisor y asignárselo:** `issuers_certificate({id, username, alias?})`, donde `id` es el del emisor. El CUIT efectivo es el de ese emisor; el campo opcional `tax_id` no permite elegir otro dueño en este flujo. No llames después a `certificates_create` para el mismo objetivo.

El alias sólo admite letras ASCII y números, hasta 100 caracteres; si no se envía se usa `afipsdk`. No generes aliases distintos como mecanismo de reintento. El MCP fija el origen de automatización: no envíes `source`, `cert`, `key` o `password`.

Ambas herramientas responden 202 con `automation_id`. Conservá ese ID y consultá `automations_get`: el resultado completo contiene `certificate`, `created` y `authorization`. La variante de emisor añade `issuer_id` y `delegation` a los metadatos del certificado. `created: false` puede indicar reutilización de un registro; no fuerces otra creación sólo por ese valor.

La creación ya incluye autorización para `wsfe`; no agregues otra llamada de autorización por rutina. Si hubo un conflicto porque el emisor cambió durante la creación, el certificado puede estar guardado pero sin asignarse. Recuperalo con la lista o detalle y revisá el emisor actual antes de asignarlo; no repitas el trámite para resolver ese conflicto.

## Asignar uno existente

`issuers_edit({id: issuerId, certificate_id: certificateId})` asigna un certificado activo del mismo proyecto y entorno. No requiere volver a crearlo ni pedir clave fiscal. `certificate_id: null` lo desasigna: usalo sólo si se pidió dejar al emisor sin certificado.

Una asignación que cambia el certificado de un emisor verificado lo deja `inactive` y borra `verified_at`, incluso si el certificado nuevo ya está autorizado para `wsfe`. Avisá este efecto antes de cambiar la asignación. No intentes mantenerlo activo enviando `status: active`. Para identificar o revisar el emisor y completar su configuración, usá la skill `configurar-emisores`.

Si el certificado pertenece a otro CUIT, asignarlo no crea la delegación fiscal. El emisor debe haber delegado `wsfe` al dueño del certificado en ARCA, y el flujo de emisores puede aceptar esa delegación y autorizar su uso. No confundas esto con autorizar `wsfe` para el propio dueño del certificado.

Una nueva verificación del emisor es un paso separado: **en producción emite una factura REAL de $1 y su nota de crédito**. No la ejecutes sólo para probar una asignación o autorización si ese efecto no estaba incluido en la solicitud. Si ya se autorizó expresamente completar la verificación con ese efecto, no dupliques la aprobación.

## Autorizar para wsfe

`certificates_authorize({id, username?})` sirve para autorizar un certificado existente, por ejemplo uno cargado manualmente cuya emisión falla con `web_service_not_authorized`. Si se omite `username`, usa el CUIT del certificado para buscar su credencial guardada; si el login es otro, envialo explícitamente después de identificarlo. Sólo acepta un certificado activo.

No admite otro servicio como parámetro: siempre es `wsfe`. Devuelve `automation_id`; el resultado completo incluye `certificate` y `authorization` (`created` o `exists`). Autorizar no renueva, no reactiva un certificado revocado y no verifica emisores. Si el certificado está vencido o revocado, no repitas autorizaciones ni crees uno nuevo automáticamente: resolvé el objetivo de reemplazo o renovación con el usuario.

## Revocar y límites de MCP

`certificates_revoke({id})` impide inmediatamente el **uso local** del certificado. Los emisores que lo tengan asignado no podrán emitir con él hasta tener uno utilizable. No revoca el certificado en ARCA, no elimina sus comprobantes ni asigna un reemplazo. Si se necesita identificar los emisores afectados, consultá `issuers_list` con `certificate_id` mediante la skill `configurar-emisores`; no inventes el alcance del impacto.

Confirmá el certificado y el efecto solicitado antes de revocar; una petición concreta que ya incluye ambos es autorización suficiente. Una respuesta exitosa debe mostrar `status: revoked`. Si una respuesta se pierde, consultá `certificates_get` antes de repetir una escritura. No ofrezcas deshacer la revocación con `authorize`: esa herramienta la rechaza.

El catálogo **no expone una herramienta de renovación ni de carga manual de PEM/clave privada**. Aunque un error mencione una ruta REST `/renew`, no la inventes como herramienta MCP. Para renovar conservando el registro y sus asociaciones, o cargar material manualmente, indicá el flujo autenticado de certificados del dashboard. No sustituyas silenciosamente una renovación por `certificates_create` o por una automatización genérica de Afip SDK, ni prometas conservar ID y asociaciones mediante una creación nueva.

## Recuperación sin duplicados

La envoltura MCP `status` es HTTP; el trabajo está en `data.status` (`in_process`, `complete`, `error`) y su resultado en `data.data`. Un 200 o 202 no prueba éxito. Conservá los IDs y consultá sin sondeo continuo; si hay error, informá su código y mensaje sin secretos.

Los flujos persistidos recuperan operaciones por proyecto, entorno e intención. Ante una respuesta perdida, consultá el `automation_id` conocido. Para recuperar la misma solicitud, mantené los mismos parámetros y omití `previous_automation_id`; el servidor puede devolver una operación existente antes de necesitar la credencial. No cambies alias, CUIT, emisor o conexión para evitar ese control.

Si el resultado trae `recovery.retry_safe: true`, corregí la causa y reintentá la misma operación dentro del alcance autorizado. Si sigue en curso, tiene resultado incierto, devuelve `automation_outcome_unknown` o no confirma que el reintento sea seguro, detené nuevos intentos y conservá el ID para diagnóstico. Un timeout o una expiración del trabajo no prueban que ARCA no haya creado o autorizado el certificado.

`previous_automation_id` sólo sirve para una **operación nueva deliberada** después de consumir un resultado completado y autorizar esa nueva operación. Nunca se usa para consultar, reanudar o repetir un error; tampoco permite saltar un trabajo en curso o incierto. Cerrá informando el ID/CUIT/alias, el resultado confirmado, las asignaciones efectivas y cualquier verificación o paso pendiente, sin afirmar que una respuesta aceptada ya terminó.
