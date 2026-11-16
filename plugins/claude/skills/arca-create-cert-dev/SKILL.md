---
name: "arca-create-cert-dev"
description: "Crear un certificado de homologación de ARCA con un alias y CUIT mediante las automatizaciones de Afip SDK. No usar para renovar registros de certificados de Factura SDK."
---

# Crear un certificado de homologación

Si el usuario ya tiene un ID y sólo pide retomar o consultar esa operación, usá `automations_get({id})` directamente en la conexión correspondiente. No vuelvas a pedir datos de creación ni exigir una credencial guardada para leer su estado; un ID no accesible no autoriza crear otra operación.

## Conexión y credencial

Usá el MCP `afipsdk`. Comprobá con `project_current` que la conexión corresponde al proyecto **Afip SDK / Web Services y Automatizaciones** (`product: afipsdk`). Si está conectado Factura SDK, pedí conectar el proyecto adecuado: no cambies de producto ni uses sus herramientas como sustituto.

Distinguí `cuit` (contribuyente representado, entero o texto de 11 dígitos) de `username` (CUIT de quien inicia sesión en ARCA, cadena de 11 dígitos). No supongas que son iguales. Consultá `arca_credentials_list` con `cuit` igual al **username**, no al representado. Sólo devuelve metadatos. Si falta la credencial, indicá guardarla en Configuración → Credenciales de ARCA del proyecto y retomar; no pidas contraseñas, tokens ni claves privadas en el chat. Estas automatizaciones usan la credencial real de ARCA, incluso las de homologación.

## Creación solicitada

Leé [el esquema de entrada](references/input-schema.json) y prepará `automations_create_cert_dev`. Los parámetros son `cuit`, `username` y `alias`; el alias sólo admite letras ASCII y números. No inventes un alias si podría reemplazar o confundirse con uno existente: definilo con el usuario.

Pasá los campos directamente como argumentos, sin `automation` ni `params`: la herramienta ya fija la operación. El inicio crea un trabajo persistido, requiere `automations:write` y puede consumir el servicio; el seguimiento usa `automations:read`.

La operación crea material para **homologación de ARCA**, usando un login real; no es la creación simulada de certificados en Factura SDK `dev`. Confirmá ese ambiente y la identidad del certificado si no están claros. La autorización explícita del usuario para esa creación alcanza, sin una pregunta redundante.

Crear no autoriza automáticamente un web service ni asigna el certificado a un emisor. No ejecutes esas mutaciones adicionales salvo que estén solicitadas. Tampoco presentes esta acción genérica como renovación que conserva un ID de Factura SDK.

## Material resultante

El MCP redacta los resultados sensibles, incluidos PEM y clave privada. Si el trabajo finaliza, informá su ID, CUIT y alias conocidos, sin afirmar que el certificado quedó guardado en Factura SDK ni inventar enlaces de descarga. Para recuperar material privado, dirigí al flujo autenticado del dashboard o a la API REST existente; no pidas pegarlo en el chat ni intentes obtenerlo por otra herramienta para eludir la redacción.

## Ejecución y seguimiento

Enviá una única llamada a `automations_create_cert_dev` con los argumentos directos del esquema. Conservá el `id` recibido y consultá `automations_get` con ese mismo `id`, sin sondeo continuo. La envoltura MCP `status` es HTTP; el trabajo está en `data.status`: `in_process`, `complete` o `error`. Un HTTP 200 o la creación del trabajo no prueban que el trámite terminó. Interpretá el resultado del proveedor dentro de `data.data` sólo al completar.

No hay una clave de idempotencia para el inicio de esta automatización. Ante timeout, respuesta perdida o resultado incierto, consultá el ID existente; si no lo tenés o no aclara lo ocurrido, detené el reenvío y explicá qué debe verificarse. No vuelvas a crear el trámite a ciegas. Informá el error y código disponibles sin secretos; no prometas éxito ni sortees permisos, bloqueos o límites del plan.
