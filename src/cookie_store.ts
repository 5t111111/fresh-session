import { decrypt, encrypt } from "./crypt.ts";
import { type Cookie, getCookies, setCookie } from "../deps.ts";
import type { CookieOptions } from "./middleware.ts";
import type { SessionObject } from "./session.ts";

/**
 * Cookie store options
 */
type CookieStoreOptions = {
  encryptionKey: string;
  cookieOptions?: CookieOptions;
  sessionCookieName?: string;
};

/**
 * Cookie based session store class
 */
export class CookieStore {
  /**
   * Encryption key
   */
  public readonly encryptionKey: string;

  /**
   * Cookie options
   */
  public readonly cookieOptions: CookieOptions | undefined;

  /**
   * Session cookie name
   */
  public readonly sessionCookieName: string;

  /**
   * Constructor
   *
   * if sessionCookieName is not provided, it will default to "session"
   *
   * @param options
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
  async getSession(req: Request): Promise<SessionObject | null> {
    // Get cookies from request headers
    const cookies = getCookies(req.headers);

    // Get session cookie from cookies
    const sessionCookie = cookies[this.sessionCookieName];

    // Return null when session cookie does not exist
    if (!sessionCookie) {
      return null;
    }

    let sessionDataRaw: string;

    try {
      sessionDataRaw =
        (await decrypt(this.encryptionKey, sessionCookie)) as string;
    } catch {
      // Return null when decryption fails
      return null;
    }

    let sessionObject: SessionObject;

    try {
      sessionObject = JSON.parse(sessionDataRaw) as SessionObject;
    } catch {
      // Return null when JSON parse fails
      return null;
    }

    return sessionObject;
  }

  /**
   * Create a set-cookie header with session data
   *
   * @param headers Headers object to add set-cookie header
   * @param sessionObject Session object to be stored in the cookie
   * @returns Headers object with set-cookie header
   */
  async createSetCookieHeader(headers: Headers, sessionObject: SessionObject) {
    // Serialize session object into a string
    const serialized = JSON.stringify(sessionObject);

    const cookie: Cookie = {
      name: this.sessionCookieName,
      value: await encrypt(this.encryptionKey, serialized),
      ...this.cookieOptions,
    };

    // Modify headers with set-cookie header
    setCookie(headers, cookie);

    return headers;
  }
}
