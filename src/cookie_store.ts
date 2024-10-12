import { decrypt, encrypt } from "./crypt.ts";
import type { CookieOptions } from "./middleware.ts";
import type { SessionState } from "./session.ts";
import { type Cookie, getCookies, setCookie } from "@std/http";

/**
 * Options for configuring the CookieStore.
 */
interface CookieStoreOptions {
  /**
   * The key used to encrypt the session cookie value.
   */
  encryptionKey: string;

  /**
   * Options for configuring the session cookie.
   */
  cookieOptions?: CookieOptions;

  /**
   * The name of the session cookie. Defaults to "session" if not provided.
   */
  sessionCookieName?: string;
}

/**
 * Cookie based session store class.
 */
export class CookieStore {
  /**
   * The key used to encrypt the session cookie value.
   */
  public readonly encryptionKey: string;

  /**
   * Options for configuring the session cookie.
   */
  public readonly cookieOptions: CookieOptions | undefined;

  /**
   * The name of the session cookie. Defaults to "session" if not provided.
   */
  public readonly sessionCookieName: string;

  /**
   * Constructor for the CookieStore class.
   *
   * If sessionCookieName is not provided, it will default to "session".
   *
   * @param options Options to configure the CookieStore.
   */
  constructor(options: CookieStoreOptions) {
    this.encryptionKey = options.encryptionKey;
    this.cookieOptions = options.cookieOptions;
    this.sessionCookieName = options.sessionCookieName || "session";
  }

  /**
   * Get session data from cookies in request
   *
   * @param req Request object to get cookies from
   * @returns Session object or null when something goes wrong
   */
  async getSession(req: Request): Promise<SessionState | null> {
    // Get cookies from request headers.
    const cookies = getCookies(req.headers);

    // Get session cookie from cookies.
    const sessionCookie = cookies[this.sessionCookieName];

    // Return null when session cookie does not exist.
    if (!sessionCookie) {
      return null;
    }

    let sessionDataRaw: string;

    try {
      sessionDataRaw =
        (await decrypt(this.encryptionKey, sessionCookie)) as string;
    } catch {
      // Return null when decryption fails.
      return null;
    }

    let state: SessionState;

    try {
      state = JSON.parse(sessionDataRaw) as SessionState;
    } catch {
      // Return null when JSON parse fails.
      return null;
    }

    return state;
  }

  /**
   * Get session data from cookies in the request.
   *
   * @param  req - The request object to get cookies from.
   * @returns The session object or null if something goes wrong.
   */
  async createSetCookieHeader(
    headers: Headers,
    state: SessionState,
  ): Promise<Headers> {
    // Serialize session object into a string.
    const serialized = JSON.stringify(state);

    const cookie: Cookie = {
      name: this.sessionCookieName,
      value: await encrypt(this.encryptionKey, serialized),
      ...this.cookieOptions,
    };

    // Modify headers with set-cookie header.
    setCookie(headers, cookie);

    return headers;
  }
}
