# Fresh Session

> [!TIP]
> Are you looking for a module for newly designed middleware for Fresh v2?
> Please check the
> [fresh-v2 branch](https://github.com/5t111111/fresh-session/tree/fresh-v2).

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
import { sessionPlugin } from "@5t111111/fresh-session";

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
      cookieOptions: { path: "/", secure: true, sameSite: "Lax" },
    }),
  ],
});
```

The session data is stored as the state of the context. Therefore, within your
routes, you can access it using ctx.state.session.

A typical way to get a session is as follows:

```tsx
// routes/profile.tsx

import { Handlers, PageProps } from "$fresh/server.ts";
import { type JsonCompatible, Session } from "@5t111111/fresh-session";

interface State {
  session: Session;
}

interface User {
  id: number;
  name: string;
}

interface Props {
  user: User;
}

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  GET(_req, ctx) {
    const session = ctx.state.session;
    const user = session.get<JsonCompatible<User>>("user");

    if (!user) {
      return new Response(null, {
        status: 307,
        headers: { Location: "/sign_in" },
      });
    }

    return ctx.render({
      user,
    });
  },
};

export default function ProfilePage({ data }: PageProps<Props>) {
  const { user } = data;

  return (
    <main>
      <h1>Profile</h1>
      <p>
        {user.name} profile page. You cannot visit this page before logging in.
      </p>
    </main>
  );
}
```

Please note that when retrieving values from the session, we are using the
utility type `JsonCompatible` with type parameters. The session can only store
serializable values, which is equivalent to values that can be serialized to
JSON. Therefore, if the value stored in the session is a primitive like a
string, it can be retrieved as is. However, if the value is an object or
something similar, it is necessary to apply the `JsonCompatible` type to the
type parameter. This ensures type-safe retrieval of values from the session.

You can also set data to the session in a similar way:

```tsx
// routes/sign_in.tsx

import { Handlers } from "$fresh/server.ts";
import { type JsonCompatible, Session } from "@5t111111/fresh-session";

interface State {
  session: Session;
}

interface User {
  id: number;
  name: string;
}

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    // Check if the user exists in the database and the password is correct...

    // Set the user in the session.
    const user: User = { id: 1, name: "Alice" };
    const session = ctx.state.session;
    session.set<JsonCompatible<User>>("user", user);

    // Redirect user to profile page.
    return new Response(null, {
      status: 302,
      headers: { Location: "/profile" },
    });
  },
};

export default function SignInPage() {
  return (
    <form method="post">
      <input type="email" name="email" value="" />
      <input type="password" name="password" value="" />
      <button type="submit">Sign in</button>
    </form>
  );
}
```

The `JsonCompatible` type parameter is needed here too if you would like to
store complex types like objects.

## Contributing

If you would like to contribute to the development, you can run unit tests as
described below, so please make sure there are no regressions.

```shell
deno task dev
```
