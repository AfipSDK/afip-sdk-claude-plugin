---
name: "emitir-comprobantes"
description: "Emitir facturas electrónicas, notas de crédito y débito con Factura SDK; preparar los datos fiscales y recuperar la misma emisión sin duplicarla. No usar para consultar comprobantes recibidos en ARCA."
---

# Emitir comprobantes con Factura SDK

## Conexión, emisor y alcance

Usá el MCP `afipsdk`. `project_current` debe identificar `product: facturasdk`; una conexión Afip SDK / Web Services y Automatizaciones no sustituye este flujo. Confirmá el ambiente de la conexión antes de emitir: **prod genera comprobantes fiscales reales; dev es simulado, no homologación ARCA**. `project_current` no devuelve el ambiente: no lo deduzcas de sus contadores. Si no está claro, comprobalo en el contexto de conexión con el usuario antes de escribir.

Buscá el emisor con `issuers_list` por `tax_id` y, si hace falta, `issuers_get`. Debe estar activo, con certificado y punto de venta válidos. No crees, edites ni verifiques emisores silenciosamente: `issuers_verify` realiza una emisión de verificación y su nota de crédito, no una lectura inocua. Si falta configuración, explicá lo pendiente y seguí sólo el alcance autorizado. No pidas contraseñas, tokens ni claves privadas en el chat.

## Preparar el comprobante

Leé [el esquema exacto de invoices_create](references/input-schema.json). Pedí únicamente datos faltantes; no inventes datos del receptor, condición fiscal, alícuotas ni importes.

- `invoice_type`: factura A/B/C = `1/6/11`; nota de crédito A/B/C = `3/8/13`; débito A/B/C = `2/7/12`. Respetá las condiciones IVA de emisor y receptor, no elijas una clase sólo por el total.
- Obligatorios: `issuer_cuit`, `invoice_type`, `concept`, `receiver` con documento, condición IVA, nombre y domicilio; `amounts` completos; `items` con descripción, cantidad entera, precio y subtotal; `sale_condition`; `idempotency_key`. El punto de venta lo toma del emisor: no se envía como campo de la creación.
- Cuadrá `total = net + vat + exempt + untaxed + tributes`. A/B con neto positivo requieren `vat_items`; sus bases e importes deben sumar neto e IVA. C lleva IVA cero y no lleva `vat_items`. Tributos positivos requieren `tribute_items`; ítems A con IVA requieren `vat_rate`.
- `concept` 2/3 exige `service_dates.from`, `.to` y `.due`; fechas en `YYYY-MM-DD`, desde no posterior a hasta. Moneda omitida = `PES`; si se envía cotización en PES, debe ser 1. `DOL` requiere `exchange_rate` positivo confirmado, nunca inventado.
- Una nota exige `reason` y **sólo uno** de `associated_invoices` o `associated_period`. Para ajustar una factura concreta, obtené tipo, punto de venta y número reales con `invoices_get`. No confundas el ID interno con el número fiscal ni con el CAE; no inventes un período para omitir la referencia.

Antes de emitir en producción, presentá el resumen concreto de emisor, receptor, tipo, total/moneda y referencia si aplica. Ejecutá cuando ese alcance esté autorizado; no repitas una aprobación ya explícita sobre el mismo contenido.

## Emisión, recuperación y resultado

Llamá a `invoices_create` una vez y conservá `id` e `idempotency_key`. Leé el estado del comprobante en `data.status`, no el `status` HTTP de la envoltura MCP. Para `queued`/`processing`, consultá `invoices_get` espaciadamente. Ante timeout, recuperá por ID; si no llegó un ID, sólo repetí el mismo payload con la **misma clave**. No cambies de clave para salir de un resultado incierto.

La misma clave recupera el registro y **no compara ni actualiza** un payload diferente. En estados `failed`/`cancelled` puede reencolarlo: no la repitas como consulta. Para una corrección o una operación nueva, verificá primero el resultado anterior y el alcance autorizado. `rejected` no se corrige cambiando el cuerpo con la misma clave.

Sólo `approved` confirma aprobación; mostrá únicamente número, CAE, vencimiento, observaciones y errores devueltos. Pedí el enlace a `invoices_pdf` si se necesita; no inventes un PDF pendiente. `invoices_cancel` sólo cancela emisiones pendientes: **no anula una factura aprobada**. Una nota de crédito es una nueva emisión autorizada, nunca un paso automático de limpieza.
