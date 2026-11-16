---
name: "cancelar-comprobante-pendiente"
description: "Cancelar la emisión de un comprobante de Factura SDK que todavía está en cola. Usar cuando el usuario pide detener un comprobante pendiente; no anula aprobados, interrumpe solicitudes en ARCA ni cancela comprobantes de verificación del emisor."
---

# Cancelar un comprobante pendiente

## Identificar el comprobante

Usá el MCP `afipsdk` en un proyecto **Factura SDK** (`project_current` devuelve `product: facturasdk`). Conservá el proyecto y ambiente de esa conexión: no los cambies con argumentos ni uses las automatizaciones genéricas de ARCA. El ambiente no se devuelve en `project_current` ni en el detalle público del comprobante; si no está claro, comprobalo en el contexto de conexión con el usuario.

Necesitás el **ID interno** del comprobante, no su número fiscal ni CAE. Si el usuario no lo proporciona, buscá con `invoices_list` usando los filtros disponibles y seguí el cursor cuando corresponda. Mostrá los candidatos relevantes y resolvé cualquier ambigüedad; no canceles el primero, el más reciente o todos por defecto. Verificá ID, emisor, receptor, importe y estado mediante `invoices_get({id})`.

El pedido explícito de cancelar ese comprobante es la autorización: no repitas una confirmación ya dada sobre el mismo ID y contexto. Si sólo preguntó si se puede cancelar, explicá el estado sin ejecutar la cancelación. No pidas contraseña ni claves; las lecturas y la escritura usan los permisos de la conexión. Un error de acceso no autoriza buscar el mismo ID en otro proyecto o ambiente.

## Decidir según el estado actual

- `verification: true`: **no se puede cancelar**, aunque esté en cola. Son comprobantes del flujo de verificación del emisor; no interrumpas su continuidad ni emitas una nota de crédito independiente para compensarlos.
- `queued`: todavía puede cancelarse. Leé [el esquema de invoices_cancel](references/input-schema.json) y llamá `invoices_cancel({id})` con el mismo ID autorizado. No envíes cuerpo fiscal, motivo, estado ni clave de idempotencia.
- `cancelled`: ya está cancelado. Informalo; no vuelvas a emitir ni recrees el comprobante.
- `processing`: la autorización en ARCA está en curso y **ya no puede detenerse por esta herramienta**. Consultá `invoices_get` de forma espaciada y acotada si el usuario necesita el resultado; no prometas que se canceló ni que esperar impida la emisión.
- `approved`: no puede anularse con `invoices_cancel`. Explicá que corresponde una nota de crédito con el alcance autorizado; no la emitas automáticamente por un pedido de cancelar un pendiente.
- `rejected` o `failed`: no hay una emisión en cola que cancelar. Informá el estado y el diagnóstico devueltos; no lo transformes en `cancelled` ni reintentes la emisión.
- Estado desconocido o respuesta incompleta: no supongas que sigue en cola. Consultá el detalle y explicá lo que no pudo confirmarse.

## Carrera, respuesta perdida y resultado

El estado leído puede cambiar antes del POST. La API decide de forma atómica: si devuelve conflicto `409`, consultá de nuevo `invoices_get` y seguí el estado real. Si el rechazo indica que es un comprobante de verificación, respetalo. No alteres el ID, uses otra herramienta ni emitas una nota para eludir ese rechazo.

Leé la envoltura MCP `{status, data}`: el `status` externo es HTTP; el estado fiscal está en `data.status`. Confirmá éxito únicamente si el comprobante devuelto o consultado tiene el mismo ID y `data.status: cancelled`. No basta con que la petición no arroje un error.

Ante timeout o pérdida de respuesta, recuperá con `invoices_get({id})`. Si ya está `cancelled`, terminá. Si permanece `queued` y el pedido sigue vigente, podés reintentar de forma acotada la **cancelación del mismo ID**; si no podés verificar el resultado, informalo como incierto. Nunca uses `invoices_create` para consultar: reenviar su clave de idempotencia después de cancelar puede **reencolar la emisión**.

Una cancelación confirmada no envía webhook de cancelación; no esperes ese evento para declarar el resultado. Mostrá el ID y el estado final. No afirmes haber anulado un comprobante fiscal aprobado ni una operación distinta.
