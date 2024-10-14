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

A typical way to set data in a session is as follows:

**`./routes/sign_in.tsx`**

```tsx
import { Handlers } from "$fresh/server.ts";
import { Session } from "@5t111111/fresh-session";

interface State {
  session: Session;
}

export const handler: Handlers<any, State> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    // Check if the user exists in the database and the password is correct...
    // Let's assume that the type of the user data is { id: number; name: string; }.
    const user = await authenticate(email, password);

    // Set the user ID in the session.
    const session = ctx.state.session;
    session.set("isAuthenticated", true);
    session.set("userId", user.id);

    // Redirect users to profile page.
    return new Response(null, {
      status: 302,
      headers: { Location: "/profile" },
    });
  },
};

export default function SignInPage() {
  return (
    <main>
      <form method="post">
        <input type="email" name="email" value="" />
        <input type="password" name="password" value="" />
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
```

You can get data from a session in a similar way:

**`./routes/profile.tsx`**

```tsx
import { page, PageProps } from "fresh";
import { define } from "../utils.ts";

export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    const session = ctx.state.session;
    const isAuthenticated = session.get<boolean>("isAuthenticated");
    const userId = session.get<number>("userId");

    if (!isAuthenticated) {
      return new Response(null, {
        status: 307,
        headers: { Location: "/sign_in" },
      });
    }

    // For example, user information is retrieved from the database based on
    // the user ID stored in the session.
    const user = await findUserById(userId);

    return page({
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

Note that type parameters are used when retrieving data from the session. This
is necessary to handle the session data as type-safely as possible. However,
this is primarily for making the retrieved data easier to handle at the type
level, so to ensure runtime safety, it is recommended to implement validation
for the retrieved data (for example, parsing the data using Zod or Valibot).

### JsonCompatible utility type

In most cases, storing and retrieving data from the session can be done using
the methods described above. In other words:

- When using `set`, type parameters are not necessary
- When using get, provide parameters that match the type of data being retrieved

However, this alone may not allow TypeScript to infer types as expected. For
example, this could happen when the type being saved or retrieved is constrained
as an interface type.

Example:

```typescript
interface User {
  id: number;
  name: string;
}
```

When handling such types of data in a session, due to type mismatches, you may
not be able to directly use them with set or get. In such cases, a useful
utility type `JsonCompatible` has been provided. You can use it as follows:

```typescript
import { type JsonCompatible } from "@5t111111/fresh-session";

session.set<JsonCompatible<User>>("user", user);
const user = session.get<JsonCompatible<User>>("user");
```

This will resolve type errors. However, it is strongly recommended that you save
values in the session as simple data types, such as primitives. For example, as
in the previous example, it is better to save only the user ID.

## Contributing

If you would like to contribute to the development, you can run unit tests as
described below, so please make sure there are no regressions.

```shell
deno task dev
```
