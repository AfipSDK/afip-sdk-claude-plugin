# Conectar el MCP de Afip SDK

Las skills son las instrucciones; el MCP aporta las herramientas y el acceso a tu proyecto. Instalá las skills una vez y configurá una sola conexión para ese proyecto.

Endpoint: `https://app.afipsdk.com/mcp`.

## Antes de configurar

- Para Claude, conservá el consentimiento OAuth del plugin existente, cuando esté habilitado para tu cuenta.
- Para las recetas con token, usá el token del proyecto y ambiente que querés conectar, obtenido desde el [dashboard](https://app.afipsdk.com/). Factura SDK y las automatizaciones de Afip SDK son productos distintos: un token no habilita las funciones del otro.
- Los ejemplos son **fragmentos para combinar** con tu configuración: conservá otros servidores y ajustes. Si ya existe `afipsdk`, actualizá esa entrada en vez de duplicarla.
- Definí `AFIPSDK_ACCESS_TOKEN` mediante tu gestor de secretos o el entorno del proceso que ejecuta el cliente. Los ejemplos sólo contienen el nombre de la variable. No pegues tokens en el chat, comandos, archivos versionados o capturas.
- Reiniciá el cliente si cambiaste su entorno. En un cliente remoto, la variable debe estar en el host que ejecuta la conexión.

Los formatos nativos de abajo tienen sintaxis de variables diferentes. **No los copies al `mcp.json` portable de este repositorio:** ese formato no expande variables de cabeceras. El paquete portable instala las skills sin iniciar un servidor MCP; por eso la configuración nativa no duplica una conexión del plugin.

## Claude Code

El plugin conserva su `.mcp.json` y no necesita un token manual. Abrí `/mcp`, seleccioná el servidor del plugin y completá el inicio de sesión y el consentimiento. Si no podés autorizarlo, revisá la disponibilidad de la conexión para tu cuenta con [soporte](https://afipsdk.com/contact/).

No agregues una segunda entrada MCP para el mismo endpoint.

## Codex

En `~/.codex/config.toml`, combiná:

```toml
[mcp_servers.afipsdk]
url = "https://app.afipsdk.com/mcp"
bearer_token_env_var = "AFIPSDK_ACCESS_TOKEN"
```

La variable contiene el token solo, sin el prefijo `Bearer`. En esta modalidad no ejecutes `codex mcp login`: la autenticación viene del token. Abrí una sesión nueva y revisá `codex mcp list`.

[Configuración oficial de Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

## Cursor

En la configuración personal `~/.cursor/mcp.json`, combiná:

```json
{
  "mcpServers": {
    "afipsdk": {
      "url": "https://app.afipsdk.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:AFIPSDK_ACCESS_TOKEN}"
      }
    }
  }
}
```

Cursor usa `${env:NOMBRE}` en esta configuración. Los servidores HTTP no admiten `envFile`. Reiniciá Cursor después de configurar la variable y revisá el estado del servidor en las opciones MCP.

[Configuración e interpolación de Cursor](https://cursor.com/docs/mcp#config-interpolation).

## VS Code / GitHub Copilot

Para el agente **Copilot nativo**, combiná esto en `~/.copilot/mcp-config.json` (o el directorio configurado como `COPILOT_HOME`):

```json
{
  "mcpServers": {
    "afipsdk": {
      "type": "http",
      "url": "https://app.afipsdk.com/mcp",
      "headers": {
        "Authorization": "Bearer ${AFIPSDK_ACCESS_TOKEN}"
      },
      "tools": ["*"]
    }
  }
}
```

Esta receta corresponde al agente nativo de Copilot, no al formato anterior `.vscode/mcp.json` del editor. La variable debe llegar al proceso de Copilot. Con la sesión Copilot seleccionada, revisá el servidor desde **MCP: List Servers**.

[Configuración MCP de VS Code y Copilot](https://code.visualstudio.com/docs/agents/reference/mcp-configuration).

## Droid

Instalá las skills con `npx skills add`, no el plugin raíz de Claude. Combiná en `~/.factory/mcp.json`:

```json
{
  "mcpServers": {
    "afipsdk": {
      "type": "http",
      "url": "https://app.afipsdk.com/mcp",
      "headers": {
        "Authorization": "Bearer ${AFIPSDK_ACCESS_TOKEN}"
      },
      "oauth": false
    }
  }
}
```

Droid expande la variable y `oauth: false` evita iniciar un flujo OAuth que no corresponde a este cliente. Iniciá una sesión nueva y revisá el servidor en `/mcp`.

[Configuración MCP de Droid](https://docs.factory.com/harness/mcp#secrets-and-variable-expansion).

## OpenCode V2

Combiná en `opencode.jsonc` de tu proyecto:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "afipsdk": {
        "type": "remote",
        "url": "https://app.afipsdk.com/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {env:AFIPSDK_ACCESS_TOKEN}"
        }
      }
    }
  }
}
```

OpenCode V2 usa `{env:NOMBRE}`. Revisá la conexión con `opencode mcp list`.

[Configuración MCP de OpenCode](https://opencode.ai/docs/mcp-servers/).

## Antigravity

El plugin incluye `mcp_config.json` en su formato nativo. Completá `AFIPSDK_ACCESS_TOKEN` en `/plugin` o **Customizations** cuando lo solicite. Es una variable de configuración del plugin, no un token que debas insertar en este repositorio. No requiere login OAuth ni otra entrada MCP manual.

[Variables MCP y plugins de Antigravity](https://antigravity.google/docs/build-plugins#mcp-servers).

## Otros clientes y aplicaciones web

Si tu cliente admite MCP remoto con cabecera de autorización, configurá el endpoint y un token de proyecto mediante su interfaz de credenciales o su formato nativo. No presupongas que entiende alguna de las sintaxis de variables de arriba.

ChatGPT web y Claude web utilizan su conexión autorizada desde apps/conectores, según su disponibilidad por cuenta. Agregar el endpoint no instala las skills de GitHub ni equivale a que este paquete esté publicado en sus directorios.

## Verificar la conexión

Después de instalar y conectar, abrí una sesión nueva y pedí:

> Mostrame el proyecto conectado, su producto y ambiente, sin modificar datos.

El agente debe consultar las herramientas disponibles y la información real de la conexión. Si no tiene herramientas de Afip SDK, la instalación de skills por sí sola no completó la conexión. Si falta una operación, revisá el producto, ambiente y permisos antes de cambiar configuración.

Esta comprobación es de lectura. No emitas facturas ni ejecutes automatizaciones de ARCA como prueba de instalación. Factura SDK en desarrollo es simulado; las automatizaciones pueden operar sobre ARCA real.
