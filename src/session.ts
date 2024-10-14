import type { JsonValue } from "./jsonify.ts";

/**
 * Session object to be stored in a storage and used as in-memory cache
 */
export interface SessionObject {
  /**
   * Data type representing a record of session data.
   * Each key is a string and the value is an object containing:
   * - value: The actual data to be stored.
   * - flash: A boolean indicating if the data should be removed after being read once.
   */
  data: Record<string, { value: JsonValue; flash: boolean }>;

  /**
   * Expire type representing the expiration time of a session.
   * It can be a string in ISO 8601 format or null if the session does not expire.
   */
  expire: string | null;
}

/**
 * A class to manage session data.
 */
export class Session {
  /**
   * Session object to be used as in-memory cache and stored in a storage.
   */
  private sessionObject: SessionObject;

  /**
   * Constructor
   *
   * @param sessionObject Session object to be used as in-memory cache and stored in a storage. If not provided, an empty session object is initialized.
   */
  constructor(sessionObject?: SessionObject) {
    if (sessionObject) {
      this.sessionObject = sessionObject;
    } else {
      this.sessionObject = {
        data: {},
        expire: null,
      };
    }
  }

  /**
   * Set session object in the session instance as in-memory cache.
   *
   * @param sessionObject Session object to be used as in-memory cache and stored in a storage.
   */
  setSessionObject(sessionObject: SessionObject) {
    this.sessionObject = sessionObject;
  }

  /**
   * Get session object from the session instance.
   *
   * @returns Session object cached in the session instance.
   */
  getSessionObject(): SessionObject {
    return this.sessionObject;
  }

  /**
   * Reset session object in the session instance by resetting data and expiration time.

   * @param expirationAfterSeconds Reset expiration time after seconds.
   */
  reset(expirationAfterSeconds?: number) {
    this.sessionObject = {
      data: {},
      expire: this.calculateExpireDate(expirationAfterSeconds),
    };
  }

  /**
   * Refresh session expiration time.
   *
   * @param expirationAfterSeconds Reset expiration time after seconds.
   */
  refresh(expirationAfterSeconds: number) {
    this.sessionObject.expire = this.calculateExpireDate(
      expirationAfterSeconds,
    );
  }

  /**
   * Check if the session is expired.
   *
   * @returns true if the session is expired.
   */
  isExpired(): boolean {
    return !!this.sessionObject.expire &&
      Date.now() > new Date(this.sessionObject.expire).getTime();
  }

  /**
   * Get session data by key.
   *
   * @param key Session data key.
   * @returns data for the key.
   */
  get<T extends JsonValue = JsonValue>(key: string): T | null {
    const entry = this.sessionObject.data[key];

    if (entry) {
      const value = entry.value as T;
      if (entry.flash) {
        delete this.sessionObject.data[key];
      }

      return value;
    } else {
      return null;
    }
  }

  /**
   * Set session data by key.
   *
   * @param key Session data key.
   * @param value Session data value.
   */
  set(key: string, value: JsonValue) {
    this.sessionObject.data[key] = {
      value,
      flash: false,
    };
  }

  /**
   * Set session data and mark it as flash data to be removed after the next request.
   *
   * @param key Session data key.
   * @param value Session data value.
   */
  flash(key: string, value: JsonValue) {
    this.sessionObject.data[key] = {
      value,
      flash: true,
    };
  }

  /**
   * Calculate the expiration date based on the given number of seconds.
   *
   * @param expirationAfterSeconds The number of seconds after which the session should expire. If undefined, it returns null.
   * @returns The calculated expiration date in ISO 8601 format, or null if no expiration is set.
   */
  private calculateExpireDate(
    expirationAfterSeconds: number | undefined,
  ): string | null {
    if (expirationAfterSeconds) {
      const date = new Date(Date.now() + expirationAfterSeconds * 1000);
      return date.toISOString();
    } else {
      return null;
    }
  }
}
