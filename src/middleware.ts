import type { Cookie, FreshContext } from "../deps.ts";
import { Session } from "./session.ts";
import { CookieStore } from "./cookie_store.ts";

/**
 * Cookie options
 */
export type CookieOptions = Omit<Cookie, "name" | "value">;

/**
 * Session options
 */
export type SessionOptions = {
  encryptionKey: string;
  expireAfterSeconds?: number;
  cookieOptions?: CookieOptions;
  sessionCookieName?: string;
};

/**
 * Customized state for the plugin middleware
 */
export type PluginMiddlewareState = {
  session: Session;
};

/**
 * Middleware for session management
 *
 * @param options Options to configure the session middleware handler
 * @returns Middleware handler
 */
export const sessionMiddleware = (options: SessionOptions) => {
  /**
   * Middleware handler
   */
  return async (req: Request, ctx: FreshContext<PluginMiddlewareState>) => {
    if (ctx.destination !== "route") {
      return await ctx.next();
    }

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

    // Create a new cookie store instance
    const store = new CookieStore({
      encryptionKey,
      cookieOptions,
      sessionCookieName,
    });

    // Create a new session instance with the empty session object
    const session = new Session();

    // Get session object from the request
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

    // Set session in the context state
    ctx.state.session = session;

    // Call the next handler
    const resp = await ctx.next();

    // Create set-cookie header
    const headers = await store.createSetCookieHeader(
      new Headers(),
      session.getSessionObject(),
    );

    // Append constructed set-cookie headers to the response headers
    headers.forEach((value, key) => {
      resp.headers.set(key, value);
    });

    return resp;
  };
};
