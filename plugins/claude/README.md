# Afip SDK para Claude

<img src="./icon.png" alt="Afip SDK" width="80" height="80">

Facturación electrónica y trámites de ARCA con Afip SDK: 30 skills en español y una conexión MCP remota para operar sobre el proyecto y ambiente que autorices.

## Requisitos

Necesitás una cuenta de Afip SDK, un proyecto compatible con la operación y acceso a la conexión OAuth de Claude. Las herramientas disponibles dependen del producto, ambiente y permisos autorizados. Las skills no habilitan permisos adicionales ni cambian el proyecto conectado.

## Instalación en Claude Code

Instalá el plugin desde el catálogo de Afip SDK:

```sh
claude plugin marketplace add AfipSDK/skills
claude plugin install afipsdk@afipsdk --scope user
```

Abrí una sesión nueva, ejecutá `/mcp`, elegí Afip SDK y completá el consentimiento en el navegador. El plugin ya incluye la conexión a `https://app.afipsdk.com/mcp`: no agregues otro servidor al mismo endpoint ni edites `.mcp.json` para poner credenciales.

Para cargar una copia local:

```sh
git clone https://github.com/AfipSDK/skills.git
claude --plugin-dir ./skills/plugins/claude
```

La instalación por CLI sólo corresponde a Claude Code. En Claude web, Desktop o Cowork, usá las opciones de plugins y conectores habilitadas para tu cuenta; conectar un MCP por separado no instala estas skills. El catálogo de GitHub no implica que el plugin esté publicado o aprobado en el directorio de Anthropic.

## Qué podés hacer

- Emitir y consultar comprobantes, cancelar emisiones pendientes y configurar emisores.
- Gestionar certificados y webhooks, y consultar consumo.
- Usar 23 automatizaciones de ARCA, incluidas Mis Comprobantes, Monotributo, Mis Retenciones, Domicilio Fiscal Electrónico, cuentas y aportes.

Cada skill incluye sus esquemas y referencias de herramientas. Factura SDK en desarrollo es simulado; las automatizaciones consultan u operan sobre ARCA real. Cancelar una emisión pendiente no anula un comprobante aprobado.

Pedí el flujo en lenguaje natural:

- «Mostrame el proyecto conectado y su plan, sin modificar datos».
- «Buscá el último comprobante aprobado y pasame su PDF».
- «Consultá los comprobantes que me emitieron este mes».

En Claude Code también podés invocar `/afipsdk:consultar-comprobantes` o `/afipsdk:arca-mis-comprobantes`.

Para escribir, confirmá el alcance y el ambiente cuando no estén claros. No pegues contraseñas de ARCA, tokens ni claves privadas en el chat; las credenciales de ARCA se administran en el dashboard de Afip SDK.

## Documentación y soporte

[Factura SDK](https://afipsdk.com/docs/facturasdk/) · [Documentación](https://docs.afipsdk.com/) · [Soporte](https://afipsdk.com/contact/) · [Privacidad](https://afipsdk.com/privacy-policy/) · [Términos](https://afipsdk.com/terms-and-conditions/)

Copyright Afip SDK. Licencia propietaria; el paquete no otorga una licencia open source. El uso del servicio está sujeto a los términos de Afip SDK existentes.
