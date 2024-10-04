# Fresh Session

This middleware provides a simple cookie-based session management system for
your [Fresh](https://fresh.deno.dev/) application.

> [!NOTE]
> Currently, this plugin only supports cookies as the session storage. Planning
> to support other storage methods like Deno KV in the future.

## Getting started

Add the module to your Fresh application:

```shell
deno add @5t111111/fresh-session
```

Then, import the middleware and configure your app to use it:

```ts
import { App } from "fresh";
import { session } from "fresh-session";
import type { State } from "./utils.ts";

export const app = new App<State>();

app.use(session({
  // Key must be at least 32 characters long.
  encryptionKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  // Optional; the session does not expire if not provided.
  expireAfterSeconds: 3600,
  // Optional; default is "session".
  sessionCookieName: "my_session",
  // Optional; see https://jsr.io/@std/http/doc/cookie/~/Cookie
  cookieOptions: { path: "/", secure: true, sameSite: "Lax" },
}));
```

The session data is stored as the state of the context. Therefore, within your
routes, you can access it using ctx.state.session.

A typical way to use a session is as follows:

**`./utils.ts`**

```ts
import { createDefine } from "fresh";
import type { Session } from "fresh-session";

export interface State {
  session: Session;
}

export const define = createDefine<State>();
```

**`./routes/profile.tsx`**

```tsx
import { page, PageProps } from "fresh";
import { define } from "../utils.ts";

interface User {
  id: number;
  name: string;
}

interface Props {
  user: User;
}

export const handler = define.handlers({
  GET: (ctx) => {
    const session = ctx.state.session;
    const user = session.get("user") as User;

    if (!user) {
      return new Response(null, {
        status: 307,
        headers: { Location: "/sign_in" },
      });
    }

    return page({
      user,
    });
  },
});

export default function ProfilePage({ data }: PageProps<Props>) {
  const { user } = data;

  return (
    <main>
      <h1>Profile</h1>
      <p>
        {user.name}'s profile page. You cannot visit this page before sigining
        in.
      </p>
    </main>
  );
}
```

You can also set data to the session in a similar way:

**`./routes/sign_in.tsx`**

```tsx
import { Session } from "fresh-session";
import { define } from "../utils.ts";

interface State {
  session: Session;
}

interface User {
  id: number;
  name: string;
}

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    // Check if the user exists in the database and the password is correct...

    // Set the user in the session.
    const user: User = { id: 1993, name: "Deno" };
    const session = ctx.state.session;
    session.set("user", user);

    // Redirect user to profile page.
    return new Response(null, {
      status: 302,
      headers: { Location: "/profile" },
    });
  },
});

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

## Contributing

If you would like to contribute to the development, you can run unit tests as
described below, so please make sure there are no regressions.

```shell
deno task dev
```
