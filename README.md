# Fresh Session

This plugin provides a very simple session management system for your
[Fresh](https://fresh.deno.dev/) application.

> [!NOTE]
> Currently, this plugin only supports cookies as the session storage. Planning
> to support other storage methods like Deno KV in the future.

## Getting started

Add the plugin to your Fresh application:

```shell
deno add @5t111111/fresh-session
```

Then, import the plugin and add it to the plugin configuration in your
application:

```typescript
import { defineConfig } from "$fresh/server.ts";
import { sessionPlugin } from "./plugins/fresh-session/mod.ts";

export default defineConfig({
  plugins: [
    sessionPlugin({
      // Key must be at least 32 characters long.
      encryptionKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      // Optional; the session does not expire if not provided.
      expireAfterSeconds: 3600,
      // Optional; default is "session".
      sessionCookieName: "my_session",
      // Optional; see https://jsr.io/@std/http/doc/cookie/~/Cookie
      cookieOptions: { path: "/", secure: true, SameSite: "Lax" },
    }),
  ],
});
```
