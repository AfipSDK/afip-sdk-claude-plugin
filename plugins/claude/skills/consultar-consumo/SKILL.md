---
name: "consultar-consumo"
description: "Consultar el plan, límites y consumo del ciclo actual del proyecto conectado y, cuando corresponda, el último uso de sus CUITs. No reconstruye cargos ni históricos de facturación."
---

# Consultar consumo

## Proyecto y métricas disponibles

Usá el MCP `afipsdk` y comenzá por `project_current({})`. Es una herramienta compartida por **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`) y **Factura SDK** (`product: facturasdk`). Trabajá con el proyecto conectado, sin inventar parámetros para cambiar proyecto o ambiente. Leé [los contratos de consulta](references/tools.json) antes de llamar herramientas.

Interpretá el objeto `data` de la respuesta MCP. Los campos disponibles dependen del producto:

- Compartidos: `billing_plan`, `billing_period`, `subscription_status`, inicio/fin del ciclo en `subscription_current_period_start/end`, `tax_id_limit` y `current_period_tax_id_usage`.
- Factura SDK: `invoice_limit` y `current_period_invoice_usage`. `usage_basis: current_billing_period_production_only` significa que estos contadores cubren **producción en el ciclo de facturación actual**, no el sandbox dev. No infieras el ambiente de conexión a partir de esos valores: `project_current` no lo devuelve.
- Afip SDK: límites y consumos actuales de requests (`request_limit`, `current_period_request_usage`), PDF (`pdf_limit`, `current_period_pdf_usage`) y automatizaciones (`automation_limit`, `current_period_automation_usage`), junto con los planes específicos devueltos. `usage_basis: current_billing_period` identifica el ciclo actual. No sustituyas requests por comprobantes.
- Pay as you go: separá `pay_as_you_go`, `pay_as_you_go_budget`, sus fechas `subscription_pay_as_you_go_start/end` y los contadores `pay_as_you_go_*_usage` disponibles de los del ciclo actual. Estos últimos pueden superar lo incluido en el plan; los contadores pay as you go tampoco equivalen por sí solos a unidades excedentes cobradas. No sumes ambos por defecto ni conviertas presupuesto o uso en un cargo facturado.

Mostrá el período real devuelto, no supongas que coincide con el mes calendario. Un campo nulo, ausente o de otro producto no significa cero ni ilimitado; un límite explícito `-1` sí indica que esa métrica no tiene tope, no un saldo negativo. Si calculás disponibilidad o porcentaje, hacelo sólo con consumo y límite numéricos comparables del mismo ciclo: disponibilidad = límite menos consumo para límite no negativo; porcentaje = consumo / límite × 100 sólo con límite positivo. Si se excedió el límite, informá el excedente en lugar de ocultarlo como saldo cero. Ningún cálculo reemplaza el estado de suscripción ni garantiza que una operación futura vaya a ser aceptada.

## CUITs utilizados en producción

`usage_tax_ids` sólo está disponible en **Factura SDK con conexión prod** y permiso `usage:read`. Una conexión dev devuelve error aunque `project_current` muestre contadores de producción. Explicá esa diferencia y, si el detalle es necesario, pedí conectar el ambiente adecuado; no solicites tokens ni cambies el ambiente mediante argumentos. En Afip SDK, limitá este flujo a los contadores disponibles de `project_current`.

Cada fila de `usage_tax_ids` contiene `tax_id`, `business_name` si existe y `last_usage_at`: **la fecha de la última factura aprobada en prod para ese CUIT**. Los comprobantes de verificación no cuentan. No es una fila por comprobante, ni una lista de cargos cobrados.

- `start` y `end` son fechas ISO, con `start <= end`, que filtran esa **última fecha de uso**, inclusive; no filtran todos los usos históricos. Para días completos, fijá límites con zona horaria explícita.
- Sin fechas, no afirmes que las filas pertenecen sólo al ciclo actual. Para ese recorte, tomá las fechas reales del ciclo y explicá que seguís consultando último uso, no un historial de emisiones.
- El listado se ordena por último uso más reciente. Usá `limit` hasta 100 y pasá `next_cursor` sin interpretarlo ni reconstruirlo; preservá los filtros. `total_count` cuenta CUITs del resultado filtrado, no facturas ni importe monetario. Si no recorriste todas las páginas, informá cobertura parcial.

Un CUIT cuyo último uso fue después del intervalo consultado puede faltar aunque haya tenido actividad dentro de ese intervalo. Por eso ni siquiera completar la paginación reconstruye todos los CUITs usados históricamente ni permite conciliar cargos exactos. Conservá `last_usage_at` al presentar filas para hacer visible esa limitación.

## Entregar el resultado

Resumí proyecto/producto, plan, ciclo, consumos y límites efectivamente devueltos, diferenciando límites incluidos, uso actual y datos de pay as you go. Distinguí los datos originales de cualquier cálculo propio y señalá campos no disponibles. Si se pide evolución mensual, desglose por comprobante, precios o cargos exactos, explicá que estas herramientas no devuelven esos datos; no extrapoles métricas ni cambies plan, presupuesto o suscripción para completar una consulta.
