# Afip SDK Skills

<img src="./icon.png" alt="Afip SDK" width="80" height="80">

30 skills en español para operar con Factura SDK y las automatizaciones de ARCA desde tu agente.

Una sola colección en [`skills/`](skills), compartida entre clientes. Los plugins agregan el formato de instalación de cada agente; no duplican ni cambian las skills.

## Instalación

Elegí **una** de estas opciones. Los plugins incluyen las skills y la conexión MCP; la instalación por CLI agrega sólo las skills. Para operar sobre un proyecto necesitás [autorizar la conexión](docs/mcp.md). No instales las mismas skills por ambas vías.

En Claude Code, Codex, Cursor y VS Code, el plugin requiere OAuth habilitado para tu cliente y cuenta. Si no está disponible, instalá sólo las skills por CLI y usá la configuración nativa con token. Antigravity solicita un token mediante su adaptador. No mantengas dos conexiones al mismo endpoint.

### Cualquier agente compatible con Agent Skills

Desde tu proyecto, con Node.js 22.20 o posterior:

```sh
npx skills add AfipSDK/skills
```

Elegí las skills y los agentes en el asistente. Sirve, entre otros, para Codex, Cursor, OpenCode y Droid. La instalación es por proyecto; `--global` la hace disponible entre proyectos.

Para listar las skills o instalar las 30 para Codex y Cursor sin preguntas:

```sh
npx skills add AfipSDK/skills --list
npx skills add AfipSDK/skills --skill '*' --agent codex cursor --copy --yes
```

Esta vía **no instala ni autentica MCP**. Seguí la [configuración de tu cliente](docs/mcp.md). Consultá los [agentes y opciones soportados por el CLI](https://github.com/vercel-labs/skills).

### Claude Code

Instalá el plugin desde el catálogo de este repositorio:

```sh
claude plugin marketplace add AfipSDK/skills
claude plugin install afipsdk@afipsdk --scope user
```

Abrí una sesión nueva, ejecutá `/mcp`, elegí Afip SDK y completá el consentimiento en el navegador. Necesitás una cuenta y un proyecto con la conexión a Claude habilitada. La conexión queda ligada al proyecto y ambiente autorizados.

También podés instalar el plugin localmente:

```sh
git clone https://github.com/AfipSDK/skills.git
claude --plugin-dir ./skills
```

El plugin de Claude incluye el MCP. No agregues otro servidor al mismo endpoint si ya cargaste el plugin, ni edites su `.mcp.json` para poner credenciales.

### Codex

```sh
codex plugin marketplace add AfipSDK/skills
codex plugin add afipsdk@afipsdk
```

Abrí una sesión nueva y autorizá el servidor MCP incluido desde Codex. No agregues otra entrada con `codex mcp add`. Si necesitás usar un token, instalá sólo las skills por CLI y seguí la [configuración nativa de Codex](docs/mcp.md#codex).

### VS Code / GitHub Copilot

1. Activá `chat.plugins.enabled` y usá el agente de Copilot.
2. Ejecutá **Chat: Install Plugin From Source** desde la paleta de comandos.
3. Ingresá `https://github.com/AfipSDK/skills` y elegí el alcance de instalación.
4. Abrí una sesión nueva y autorizá el servidor incluido desde **MCP: List Servers**. No agregues otra conexión manual.

Para conectar con token, instalá sólo las skills por CLI y seguí la [configuración nativa de VS Code / Copilot](docs/mcp.md#vs-code--github-copilot).

### Cursor

La opción recomendada es el CLI de skills de arriba. Para usar el plugin local, cloná el repositorio completo en un directorio nuevo:

```sh
git clone https://github.com/AfipSDK/skills.git ~/.cursor/plugins/local/afipsdk
```

Reiniciá Cursor o ejecutá **Developer: Reload Window**, revisá el plugin en **Customize** y autorizá el servidor MCP incluido. Para usar un token, elegí skills por CLI en lugar del plugin y seguí la [configuración nativa de Cursor](docs/mcp.md#cursor).

### Antigravity

```sh
agy plugin install https://github.com/AfipSDK/skills
```

Abrí `/plugin` o **Customizations** y completá `AFIPSDK_ACCESS_TOKEN` en la configuración del plugin. Su adaptador MCP usa esa variable; no pegues el token en el chat. El plugin puede quedar deshabilitado hasta completar la configuración.

### Droid, OpenCode y otros agentes

Instalá con `npx skills add` y elegí tu agente. Después configurá el [MCP nativo](docs/mcp.md).

Si tu agente sólo permite copiar skills, copiá las carpetas individuales de `skills/` a su directorio de skills documentado, **incluyendo `references/`**, y abrí una sesión nueva. No todos los agentes que aceptan MCP aceptan también Agent Skills.

### ChatGPT web y Claude web / Desktop / Cowork

La instalación por CLI no instala nada en estas aplicaciones. Conectá `https://app.afipsdk.com/mcp` mediante sus opciones de apps/conectores y completá el consentimiento, cuando esté habilitado para tu cuenta u organización. Si tu cliente permite importar plugins o skills, usá esa opción por separado; no supongas que conectar MCP importa este repositorio.

Los catálogos incluidos permiten instalar desde GitHub. **No implican publicación ni aprobación en directorios de terceros.** Si no podés autorizar la conexión, contactá a [soporte](https://afipsdk.com/contact/).

## Qué podés hacer

Las skills cubren:

- **Facturación y gestión:** emitir y consultar comprobantes, cancelar emisiones pendientes, configurar emisores, gestionar certificados y webhooks, consultar consumo.
- **23 automatizaciones de ARCA:** Mis Comprobantes, Monotributo, Mis Retenciones, Domicilio Fiscal Electrónico, cuentas y aportes, entre otras. Incluyen Aportes en Línea público por CUIL y la variante autenticada por período.

Cada skill incluye sus esquemas y referencias de herramientas. La ejecución de las operaciones depende del producto, ambiente y permisos del proyecto conectado. Factura SDK en desarrollo es simulado; las automatizaciones consultan u operan sobre ARCA real. Las skills no cambian de proyecto o ambiente mediante parámetros.

Pedí el flujo en lenguaje natural:

- «Mostrame el proyecto conectado y su plan, sin modificar datos».
- «Buscá el último comprobante aprobado y pasame su PDF».
- «Consultá los comprobantes que me emitieron este mes».

En Claude Code también podés invocar `/afipsdk:consultar-comprobantes` o `/afipsdk:arca-mis-comprobantes`. Otros agentes usan su propio mecanismo para elegir skills.

Para escribir, confirmá el alcance y el ambiente cuando no estén claros. No pegues contraseñas de ARCA, tokens ni claves privadas en el chat; las credenciales de ARCA se administran en el dashboard de Afip SDK. Cancelar una emisión pendiente no anula un comprobante aprobado.

## Validar el paquete

Para comprobar archivos, manifiestos y referencias, sin conectar cuentas:

```sh
node scripts/validate.mjs
```

## Documentación y condiciones

[Factura SDK](https://afipsdk.com/docs/facturasdk/) · [Documentación de Afip SDK](https://docs.afipsdk.com/) · [Soporte](https://afipsdk.com/contact/) · [Privacidad](https://afipsdk.com/privacy-policy/) · [Términos](https://afipsdk.com/terms-and-conditions/)

Copyright Afip SDK. Licencia propietaria; el paquete no otorga una licencia open source. El uso del servicio está sujeto a los términos de Afip SDK existentes.
