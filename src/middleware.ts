import type { Cookie, MiddlewareFn } from "../deps.ts";
import { Session } from "./session.ts";
import { CookieStore } from "./cookie_store.ts";

/**
 * Options for configuring cookies used in session management.
 *
 * This type omits the `name` and `value` properties from the @std/http `Cookie` type,
 * as these are managed internally by the session middleware.
 *
 * @see {@link https://jsr.io/@std/http/doc/cookie/~/Cookie}
 */
export type CookieOptions = Omit<Cookie, "name" | "value">;

/**
 * Options for configuring the session middleware.
 */
export interface SessionOptions {
  /**
   * The key used to encrypt session data.
   */
  encryptionKey: string;

  /**
   * The number of seconds after which the session should expire. If not provided, the session does not expire.
   */
  expireAfterSeconds?: number;

  /**
   * Options for configuring the session cookie.
   */
  cookieOptions?: CookieOptions;

  /**
   * The name of the session cookie. Defaults to a standard name if not provided.
   */
  sessionCookieName?: string;
}

/**
 * Custom State includes the session instance associated with the current request.
 */
export interface SessionMiddlewareState {
  session: Session;
}

/**
 * Middleware for session management.
 *
 * @param options - Options to configure the session middleware handler.
 * @returns Middleware handler.
 */
export function session<State extends SessionMiddlewareState>(
  options: SessionOptions,
): MiddlewareFn<State> {
  /**
   * Middleware handler.
   *
   * @param req - The incoming request object.
   * @param ctx - The context object containing state and other information.
   * @returns The response object.
   */
  return async function handler(
    ctx,
  ): Promise<Response> {
    const { req, state } = ctx;

    const {
      encryptionKey,
      expireAfterSeconds,
      cookieOptions,
      sessionCookieName,
    } = options;

    if (encryptionKey.length < 32) {
      throw new Error(
        "Encryption key must be greater or equal to 32 characters long.",
      );
    }

    // Create a new cookie store instance.
    const store = new CookieStore({
      encryptionKey,
      cookieOptions,
      sessionCookieName,
    });

    // Create a new session instance with the empty session object.
    const session = new Session();

    // Get session object from the request.
    const sessionObject = await store.getSession(req);

    if (sessionObject) {
      session.setSessionObject(sessionObject);

      if (!session.isExpired() && expireAfterSeconds) {
        session.refresh(expireAfterSeconds);
      } else {
        session.reset(expireAfterSeconds);
      }
    } else {
      session.reset(expireAfterSeconds);
    }

    // Set session in the context state.
    state.session = session;

    // Call the next handler.
    const resp = await ctx.next();

    // Create set-cookie header.
    const headers = await store.createSetCookieHeader(
      new Headers(),
      session.getSessionObject(),
    );

    // Append constructed set-cookie headers to the response headers.
    headers.forEach((value, key) => {
      resp.headers.set(key, value);
    });

    return resp;
  };
}
