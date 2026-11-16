---
name: "arca-aportes-en-linea"
description: "Consultá aportes, remuneraciones y contribuciones de todos los empleadores por período con Aportes en línea de ARCA. Usar para el historial laboral del trabajador, no para CCMA ni nóminas de empleados."
---

# Consultar Aportes en línea

Si el usuario ya tiene un ID y sólo pide consultar esa operación, usá `automations_get({id})` en la conexión correspondiente. No exijas otra credencial ni crees una operación nueva para leer su estado.

## Conexión y datos

Usá el MCP `afipsdk`. Verificá con `project_current` que el proyecto autorizado sea de Web Services y Automatizaciones (`product=afipsdk`); si está conectado Factura SDK o faltan herramientas/permisos, indicá reconectar al proyecto adecuado. Esta consulta usa ARCA real.

Identificá `cuit` del trabajador consultado (entero o texto de 11 dígitos) y `username` de inicio de sesión (texto de 11 dígitos). No confundas el CUIT consultado con el de un empleador ni sustituyas el sujeto solicitado por el usuario del login. Comprobá la credencial con `arca_credentials_list`, cuyo filtro `cuit` corresponde al **login**. Si falta, indicá guardarla en Configuración → Credenciales de ARCA del proyecto. Nunca pidas contraseñas, tokens o claves en el chat ni los agregues a los argumentos.

## Preparar y ejecutar

Revisá [el esquema de entrada](references/input-schema.json). Llamá `automations_aportes_en_linea` con `cuit`, `username`, `periodo_desde` y `periodo_hasta`.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Los períodos son obligatorios, inclusivos y usan `AAAA-MM`: desde `1994-07`, en orden y con un máximo de 120 meses por solicitud. Resolvé los períodos relativos antes de enviar. La automatización divide internamente el rango en tramos de hasta doce meses y recorre **todos los empleadores**; no pidas seleccionar uno ni agregues filtros de empleador o paginación.

Leé el contenido estructurado MCP `{status, data}`. Guardá `data.id` y seguí con `automations_get({id})`, de forma acotada, hasta `data.status="complete"` o `"error"`. El HTTP externo no indica que terminó; `in_process` tampoco. El resultado está en el `data` interno de la operación completada. Si falla, falta el resultado o el seguimiento no termina, informá el diagnóstico saneado y el ID; no recrees automáticamente la operación ni presentes datos parciales como éxito.

## Interpretar y entregar

- El resultado contiene `estado`, `consultas` y `total`. `estado` (`con_registros` o `sin_registros`) es distinto del estado de ejecución.
- Conservá cada entrada de `consultas` por tramo y empleador. No elimines filas de empleadores distintos por compartir mes. `total` cuenta **filas empleador-mes**, no meses únicos ni meses con aportes pagados.
- Diferenciá remuneraciones declaradas, aportes depositados y estados de contribuciones según los campos devueltos. Conservá notas y `puede_incluir_sac`; no inventes un importe cuando sólo se devuelve un estado.
- `sin_informacion` y valores `null` no significan cero ni impago. Identificá los tramos `sin_registros` sin extender esa conclusión a otros períodos.

Entregá el resumen por empleador/período y, si lo pide, el JSON completo. La consulta no paga aportes ni presenta declaraciones.
