---
name: "arca-aportes-en-linea-publico"
description: "Consultá los aportes públicos de ARCA por CUIL, sin clave fiscal."
---

# Consultar Mis Aportes en Línea público

Si ya existe un ID, consultá `automations_get({id})`; no crees otra operación para obtener su estado o resultado.

## Conexión y entrada

Usá el MCP `afipsdk` y `project_current` para verificar `product=afipsdk`. Si faltan herramientas o permisos, indicá reconectar al proyecto adecuado. La consulta usa ARCA real.

Pasá el CUIL de la persona, no del empleador, como `cuit` de once dígitos, entero o texto sin guiones. No requiere credenciales de ARCA: no llames a `arca_credentials_list`, no pidas contraseñas ni agregues `username`, `password`, CAPTCHA, fechas o empleadores.

## Ejecutar y seguir

Según [el esquema](references/input-schema.json), llamá `automations_aportes_en_linea_publico` con `cuit` directo, sin `automation` ni `params`. El servicio resuelve el CAPTCHA.

Requiere `automations:write`, crea un job persistido y consume uso según el plan; no es idempotente. Guardá `data.id` del contenido estructurado MCP `{status, data}`. Seguí con `automations_get({id})` y `automations:read`, mediante consultas acotadas, hasta `data.status="complete"` o `"error"`. El resultado está en `data.data`: `complete` indica que el trabajo terminó, pero no garantiza que su resultado siga disponible. Si falta o venció, informá esa limitación y conservá el ID; no lo interpretes como `sin_registros`. Ante error o seguimiento inconcluso, devolvé el diagnóstico saneado y el ID, sin recrear el trabajo.

## Interpretar

- `periodo_desde` y `periodo_hasta` delimitan doce meses publicados por ARCA, no necesariamente los inmediatamente anteriores. No son elegibles.
- `estado` (`con_registros` o `sin_registros`) describe esa ventana, no el job ni toda la historia laboral.
- `empleadores[].numero` es un orden, no un CUIT. No hay nombres ni importes. `total_empleadores` cuenta empleadores y `total`, filas empleador-mes.
- No confundas declaración con pago ni `no_incluido` con `no_presentada`. Conservá `pago`, `pago_parcial` e `impago`. `texto: null` indica un estado visual reconocido, no un importe cero.
- Para histórico privado corresponde `automations_aportes_en_linea`, con sus propios requisitos; no la sustituyas automáticamente ni la confundas con CCMA.

Entregá el resumen con su ventana efectiva y, si lo pide, el JSON. No realiza pagos ni presenta declaraciones.
