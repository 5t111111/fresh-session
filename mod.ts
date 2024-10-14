/**
 * @module
 *
 * Fresh middleware to add cookie-based sessions.
 *
 * @example
 * ```ts
 * import { App } from "fresh";
 * import { session } from "fresh-session";
 * import type { State } from "./utils.ts";
 *
 * export const app = new App<State>();
 *
 * app.use(session({
 *   // Key must be at least 32 characters long.
 *   encryptionKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
 *   // Optional; the session does not expire if not provided.
 *   expireAfterSeconds: 3600,
 *   // Optional; default is "session".
 *   sessionCookieName: "my_session",
 *   // Optional; see https://jsr.io/@std/http/doc/cookie/~/Cookie
 *   cookieOptions: { path: "/", secure: true, sameSite: "Lax" },
 * }));
 * ```
 */

export { type Jsonify, Session, session } from "./src/mod.ts";
