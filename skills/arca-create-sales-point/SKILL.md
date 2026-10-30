---
name: "arca-create-sales-point"
description: "Crear un punto de venta en ARCA con número, sistema y nombre de fantasía mediante Afip SDK. Usar para el alta, no para listar ni editar un punto existente."
---

# Dar de alta un punto de venta en ARCA

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Datos del alta

Leé [el esquema de entrada](references/input-schema.json). `automations_create_sales_point` recibe `cuit`, `username`, `numero` entero positivo, `sistema` y `nombreFantasia`. Son obligatorios: no calcules un número libre suponiendo que el último visible es el máximo ni inventes el nombre comercial.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Usá un código exacto del enum de `sistema`. Por ejemplo, `MAW` es Factura Electrónica de Monotributo por Web Services y `RAW` es RECE para aplicativo y web services; `RLM`/`RLI` corresponden a Factura en Línea, no a Web Services. Si no está claro el sistema, preguntá el uso previsto antes de elegirlo. No derives la condición fiscal sólo del CUIT.

Una consulta de puntos existentes puede evitar un alta repetida: para eso existe `automations_list_sales_points` con los mismos `cuit`/`username`, seguido de `automations_get`. Esa consulta no crea puntos. Si ya conocés el estado, no la repitas innecesariamente.

Verificá la autorización para crear exactamente ese número, sistema y nombre para el CUIT indicado. El alta modifica ARCA real. No cambies a otro número después de un error ni asignes el punto a un emisor de Factura SDK sin un pedido adicional. Informá los datos que efectivamente confirme el proveedor.

## Ejecución y seguimiento

Enviá una única llamada a `automations_create_sales_point` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
