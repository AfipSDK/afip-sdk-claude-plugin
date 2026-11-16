---
name: "arca-create-cert-prod"
description: "Crear un certificado de producción de ARCA para un CUIT y alias con Afip SDK. No confundir con renovar o guardar certificados administrados por Factura SDK."
---

# Crear un certificado de producción

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Creación solicitada

Leé [el esquema de entrada](references/input-schema.json). Llamá a `automations_create_cert_prod` con `cuit`, `username` y `alias`. El alias admite únicamente letras ASCII y números. Aclaralo si el usuario sólo dio una etiqueta de pantalla o pidió renovar un registro existente.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

Antes de la mutación, asegurá que la autorización comprende ese CUIT, alias y **producción**. No ejecutes una creación de prueba en producción; si la solicitud ya es concreta, no dupliques la confirmación. No cambies automáticamente a homologación cuando falle ni generes nuevos aliases para reintentar.

Esta operación no autoriza por sí sola servicios, no asigna emisores y no garantiza conservar un registro de Factura SDK. Si el objetivo es renovar un certificado de ese producto, explicá la diferencia y usá su flujo disponible en el dashboard; no reemplaces la renovación por el inicio de esta automatización.

## Material resultante

El MCP oculta los campos sensibles de certificado y clave. Un resultado completo permite informar el trámite y su ID, no prometer que entregaste PEM, clave o un archivo descargable. La recuperación del material debe hacerse mediante el acceso autenticado existente del dashboard o la API REST, fuera del chat. No eludas la redacción ni ejecutes una segunda creación para intentar recuperar una clave.

## Ejecución y seguimiento

Enviá una única llamada a `automations_create_cert_prod` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
