# Afip SDK para Claude

Facturación electrónica y trámites de ARCA desde Claude mediante una conexión autorizada a Afip SDK.

## Qué incluye

- 30 workflows en español: emitir, consultar y cancelar comprobantes pendientes; gestionar emisores, certificados y webhooks; consultar consumo; y ejecutar 23 automatizaciones específicas de ARCA.
- Esquemas de entrada y referencias de las herramientas reales. Las funciones disponibles dependen del producto, ambiente y permisos del proyecto conectado.
- Consulta pública de Aportes en Línea por CUIL, sin clave fiscal, además de la variante autenticada por período.
- Conexión MCP remota por HTTP a `https://app.afipsdk.com/mcp`. No contiene servidores locales, dependencias de instalación, tokens ni secretos.

Factura SDK en desarrollo es simulado; las automatizaciones de ARCA consultan u operan sobre ARCA real. Las skills distinguen ambos productos y no cambian de proyecto ni ambiente por parámetros.

## Requisitos de conexión

Necesitás una cuenta y un proyecto en Afip SDK con los permisos correspondientes, y la conexión con Claude habilitada para tu cuenta. La disponibilidad de las funciones depende de tu proyecto y del cliente de Claude que uses.

### Claude Code

Usá una versión actual de Claude Code. El plugin incluye la configuración de conexión; no necesitás agregar tokens, client IDs ni secretos, ni editar `.mcp.json`.

Cloná este repositorio y cargá el plugin localmente:

```sh
git clone https://github.com/AfipSDK/afip-sdk-claude-plugin.git
claude --plugin-dir ./afip-sdk-claude-plugin
```

En Claude Code, abrí `/mcp`, elegí el servidor Afip SDK del plugin y completá el inicio de sesión y consentimiento en el navegador. La conexión queda ligada al proyecto y ambiente autorizados. No agregues manualmente otro servidor para el mismo endpoint si ya cargaste el plugin.

### Claude web, Desktop y Cowork

Conectá Afip SDK desde la sección de conectores de Claude cuando esté disponible para tu cuenta u organización. La URL del servicio es `https://app.afipsdk.com/mcp`.

Instalá el plugin mediante la opción de plugins disponible en tu cliente u organización y vinculá el conector autorizado cuando Claude lo solicite. Es un plugin con varias skills, no una única skill. La instalación del paquete no configura por sí sola la conexión de estas aplicaciones.

Esta distribución inicial no implica que el plugin ya esté publicado en el directorio de Claude. Si no encontrás el conector o no podés autorizarlo, contactá a [soporte](https://afipsdk.com/contact/).

## Usar las skills

Pedí el flujo en lenguaje natural o invocalo en Claude Code con su nombre, por ejemplo `/afipsdk:consultar-comprobantes` o `/afipsdk:arca-monotributo-info`.

- «Mostrame el proyecto conectado y su plan, sin modificar datos».
- «Buscá el último comprobante aprobado y pasame su PDF».
- «Consultá los comprobantes que me emitieron este mes».

Para escribir, confirmá el alcance concreto y el ambiente cuando no estén claros. Nunca pegues contraseñas ARCA, tokens ni claves privadas en el chat; las credenciales ARCA se administran en el dashboard de Afip SDK. Cancelar una emisión pendiente no anula un comprobante aprobado.

## Documentación y condiciones

- [Documentación de Afip SDK](https://docs.afipsdk.com/), [soporte](https://afipsdk.com/contact/), [privacidad](https://afipsdk.com/privacy-policy/) y [términos del servicio](https://afipsdk.com/terms-and-conditions/).
- [Formato oficial de plugins Claude](https://code.claude.com/docs/en/plugins-reference), [skills](https://code.claude.com/docs/en/skills) y [OAuth MCP](https://code.claude.com/docs/en/mcp#use-pre-configured-oauth-credentials).

Copyright Afip SDK. Licencia propietaria; el paquete no otorga una licencia open source. El uso del servicio está sujeto a los términos de Afip SDK existentes.
