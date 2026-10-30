---
name: "configurar-emisores"
description: "Configurar emisores para facturar: alta y edición de datos fiscales, punto de venta, certificado, delegación y verificación. También pausar, reactivar o dar de baja un emisor."
---

# Configurar emisores

Si el usuario sólo quiere consultar una operación existente, usá `automations_get({id})` en su conexión. No vuelvas a crearla ni exijas una credencial para leer su estado. Un ID de automatización no es un ID de emisor; un 404 no autoriza iniciar otra operación.

## Conexión, alcance y datos

Usá el MCP `afipsdk` con un proyecto **Factura SDK** (`product: facturasdk`). `project_current` identifica el proyecto y producto, no devuelve el entorno: tomá `dev` o `prod` de la conexión autorizada, sin inventarlo ni enviarlo como argumento. Si falta ese contexto y habrá una mutación, aclaralo antes. `dev` simula las mutaciones fiscales; no es homologación de ARCA. La consulta pública `issuers_lookup` puede leer datos reales de ARCA aun en `dev`.

Leé [las herramientas y sus esquemas](references/tools.json) para la operación elegida. No agregues campos de REST que no exponga el MCP. Respetá el alcance pedido: consultar o guardar un emisor no autoriza por sí solo crear un punto de venta, un certificado ni emitir la verificación. Cuando el usuario ya autorizó la operación concreta, sus destinatarios y entorno, no pidas otra confirmación equivalente.

Distinguí `tax_id` (CUIT del emisor, entero de 11 dígitos), `id` (ID interno del emisor), `certificate_id` y `automation_id`. Para obtener un emisor existente, usá `issuers_list` filtrado por `tax_id` y luego `issuers_get({id})`. La lista admite `status`, `certificate_id`, `cursor` y `limit`; seguí `next_cursor` si necesitás más resultados, manteniendo los filtros. Sólo muestra emisores no eliminados del proyecto y entorno conectados.

Sólo las automatizaciones de puntos de venta, certificados y delegación requieren una credencial de ARCA guardada; `issuers_verify` utiliza el certificado asignado. Para una automatización nueva, `username` es el CUIT de **inicio de sesión**, como cadena de 11 dígitos, no necesariamente el CUIT representado. Consultá `arca_credentials_list({cuit: username})` en el mismo proyecto y entorno. Si falta, indicá guardarla en Configuración → Credenciales de ARCA; no solicites ni transmitas claves fiscales, tokens, PEM o claves privadas en el chat. En `dev`, la credencial y las automatizaciones son simuladas.

## Alta y datos fiscales

1. Buscá primero el CUIT en `issuers_list` para no duplicar un alta. Si la respuesta de una creación se perdió, volvé a consultar antes de reenviarla.
2. Si necesitás completar datos desde ARCA, llamá a `issuers_lookup({tax_id})`. No guarda cambios: revisá `issuer`, `unresolved` y `warnings`. Nunca devuelve el número de ingresos brutos ni el punto de venta; no los inventes ni tomes datos incompletos como confirmados.
3. `issuers_create` requiere `tax_id`, `business_name`, `address`, `vat_condition`, `gross_income` y `activity_start_date` (`YYYY-MM-DD`). Para un emisor, las condiciones admitidas son `1, 4, 6, 7, 10, 13, 15, 16`; no uses el catálogo más amplio de receptores. `sales_point` y `certificate_id` son opcionales: omitilos si todavía faltan. El punto de venta debe estar entre `1` y `99999`; el certificado asignado debe estar activo en este proyecto y entorno.
4. Conservá el ID devuelto. Un alta exitosa crea un emisor `pending`, no uno habilitado para emitir. Si hay un 409 por CUIT existente, recuperá ese emisor: no cambies de CUIT o entorno para sortearlo.

Si falla la constancia de inscripción, informá el error y los datos que siguen faltando; la consulta no demuestra que esos datos no existan ni permite fabricarlos. No sustituyas una condición fiscal real por otra sólo para pasar la validación.

## Punto de venta

`issuers_sales_points({tax_id, username})` inicia una consulta persistida y devuelve `automation_id`; no devuelve la lista terminada en esa llamada. Consultá `automations_get`. El resultado completo contiene `tax_id`, `sales_points` de web services y `next_number`. Revisá `blocked` y `deactivated` al elegir; el filtro de web services no garantiza que el punto esté habilitado.

Si está autorizada un alta, usá `issuers_sales_points_create({tax_id, username, ...})`. Puede recibir `number`, `name`, `vat_condition` y `system`. Si se omite `number`, el servidor elige el siguiente al mayor de **todos** los puntos del CUIT, no sólo los de web services; `name` usa `Afip SDK` por defecto. Proporcioná la condición fiscal conocida para elegir el sistema correcto; no inventes `system` ni cambies sistemas para eludir un error. ARCA requiere un domicilio cargado para el CUIT.

El resultado informa `sales_point.number` y estado `created` o `exists`. Crear o encontrar el punto **no lo asigna** al emisor: usá ese número en `issuers_create` o `issuers_edit({id, sales_point})` dentro del alcance autorizado. En `dev`, un punto recién creado es simulado y no aparece necesariamente en la lista posterior.

## Certificado y delegación

- Para asignar un certificado existente, usá `issuers_edit({id, certificate_id})`; no confundas el ID con su alias o CUIT. Consultar, crear en el conjunto del proyecto, autorizar o revocar certificados corresponde a la skill `gestionar-certificados`.
- `issuers_certificate({id, username, alias?})` crea un certificado, lo autoriza para `wsfe`, lo guarda y lo asigna a ese emisor al completar. El CUIT efectivo siempre es el del emisor, aunque el esquema también admita `tax_id`; no uses ese campo para crear a nombre de otro contribuyente. El alias admite letras ASCII y números, hasta 100 caracteres, y por defecto es `afipsdk`. Seguí el `automation_id`; una respuesta 202 no confirma la asignación. MCP no permite carga manual de PEM ni clave privada.
- Un certificado de otro CUIT necesita delegación previa de `wsfe` desde el emisor hacia el dueño del certificado en ARCA. `issuers_delegation({id, username})` **acepta** esa delegación y autoriza el certificado para el emisor: no crea la delegación inicial. Requiere el certificado ya asignado y una credencial con acceso al CUIT dueño del certificado. Si el certificado es del propio emisor, este paso no corresponde. Si no hay delegación previa, indicá realizarla en el Administrador de Relaciones de ARCA y retomá sólo cuando esté resuelta.

Si una creación termina con conflicto porque el emisor cambió, el certificado puede haberse guardado sin asignarse. Recuperá el certificado existente y el estado actual del emisor; no generes otro para resolver una asignación pendiente.

## Editar, pausar o dar de baja

`issuers_edit` cambia únicamente los campos enviados. `tax_id` es inmutable. `sales_point: null` y `certificate_id: null` desasignan esos valores; no envíes `null` por datos que simplemente no conocés. Para cambiar la identidad fiscal se necesita otro emisor, no una edición encubierta del CUIT.

Un cambio efectivo de `business_name`, `address`, `vat_condition`, `gross_income`, `activity_start_date`, `sales_point` o `certificate_id` en un emisor ya verificado lo deja `inactive` y borra `verified_at`. Esto también aplica a la asignación de un certificado recién creado. Avisá antes de guardar que el emisor quedará inactivo hasta verificarlo nuevamente. Hace falta una nueva verificación; no prometas continuidad de emisión ni intentes evitarla con `status: active`.

`status: inactive` pausa y `status: active` reactiva solamente un emisor que conserva su verificación. Un `pending` no se activa editando el estado. Ante un 409 de edición concurrente, recargá y compará los datos antes de aplicar los cambios aún pedidos.

`issuers_delete({id})` es una baja lógica: el emisor deja de aparecer, conserva sus comprobantes y libera el CUIT para un alta nueva en ese proyecto y entorno. No anula comprobantes ni da de baja al contribuyente en ARCA. Usala sólo si el usuario pidió esa baja, no como atajo para un conflicto de configuración.

## Verificación y continuación

Antes de `issuers_verify({id})`, comprobá el emisor actual, su punto de venta y su certificado utilizable. En **producción emite una factura REAL de $1 a consumidor final y la nota de crédito que la compensa**; no es un chequeo de sólo lectura. Asegurá que la autorización comprende ese efecto y ese emisor; si ya se autorizó expresamente, continuá sin repetir la aprobación. En `dev` se simula. Los dos comprobantes se conservan como verificación y no consumen el cupo del plan.

Guardá `automation_id` y consultá `automations_get`. Sólo informá habilitación cuando el resultado confirme `verified: true`, el emisor `active` y ambos comprobantes aprobados. El resultado parcial puede incluir `step`, `invoice`, `credit_note` y `errors`: una factura aprobada sin su nota de crédito **no** significa verificación terminada.

Para completar una verificación autorizada que se interrumpió, retomá mediante `issuers_verify({id})` del mismo emisor. El servidor conserva la continuidad fiscal y puede reutilizar o continuar el par pendiente; no emitas manualmente otra factura/nota ni cambies la configuración para forzar un nuevo intento. `automations_get` sólo consulta, no reanuda. `issuers_verify` no acepta `previous_automation_id`. Si el servidor no puede confirmar o continuar el resultado, informá los IDs y el bloqueo; no repitas llamadas en un bucle. Una configuración cambiada durante el proceso puede exigir verificar los datos actuales después de resolver el par anterior.

## Seguimiento de las demás automatizaciones

La envoltura MCP `status` es el código HTTP. El estado del trabajo está en `data.status`: `in_process`, `complete` o `error`; el resultado está en `data.data`. Conservá el ID recibido y consultalo sin sondeo continuo. Un 200 o 202 no significa que terminó correctamente.

Los flujos de certificados, delegación y alta de punto de venta recuperan operaciones por proyecto, entorno e intención. Ante respuesta perdida, consultá el ID conocido; para recuperar por la misma operación, conservá exactamente sus parámetros y omití `previous_automation_id`. No cambies alias, CUIT o número para esquivar la recuperación. Un error con `recovery.retry_safe: true` permite reintentar después de corregir la causa; un timeout, una operación vencida o `automation_outcome_unknown` no prueban que no hubo cambios en ARCA. Si el resultado sigue incierto, detené nuevos intentos y exponé el bloqueo con su ID.

Usá `previous_automation_id` únicamente en las herramientas que lo admiten, para una **operación nueva deliberada** después de leer el resultado completo anterior y contar con autorización para la nueva. Nunca para consultar, reanudar, repetir un error ni saltar una operación en curso o incierta. Informá al terminar el CUIT/ID, el cambio confirmado, el estado actual y cualquier paso pendiente; no sortees permisos, suscripciones o errores de credencial.
