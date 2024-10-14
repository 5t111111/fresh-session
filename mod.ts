/**
 * @module
 *
 * Fresh session plugin.
 *
 * @example
 * ```ts
 * import { defineConfig } from "$fresh/server.ts";
 * import { sessionPlugin } from "@5t111111/fresh-session";
 *
 * export default defineConfig({
 *   plugins: [
 *     sessionPlugin({
 *       // Key must be at least 32 characters long.
 *       encryptionKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
 *       // Optional, the session does not expire if not provided.
 *       expireAfterSeconds: 3600,
 *       // Optional, default is "session".
 *       sessionCookieName: "my_session",
 *       // Optional, see https://jsr.io/@std/http/doc/cookie/~/Cookie
 *       cookieOptions: { path: "/", secure: true, sameSite: "Lax" },
 *     }),
 *   ],
 * });
 * ```
 */
export { sessionPlugin } from "./src/plugin.ts";

export { Session } from "./src/session.ts";
export type { Jsonify } from "./src/jsonify.ts";
