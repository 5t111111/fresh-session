type Data = Record<string, { value: unknown; flash: boolean }>;
type Expire = string | null;

/**
 * Session object to be stored in a storage
 */
export type SessionObject = {
  data: Data;
  expire: Expire;
};

/**
 * A class to manage session data
 */
export class Session {
  /**
   * Session object to be used as in-memory cache and stored in a storage
   */
  private sessionObject: SessionObject;

  /**
   * Constructor
   *
   * @param sessionObject Session object to be used as in-memory cache and stored in a storage
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
   * Set session object in the instance as in-memory cache
   *
   * @param sessionObject Session object to be used as in-memory cache and stored in a storage
   */
  setSessionObject(sessionObject: SessionObject) {
    this.sessionObject = sessionObject;
  }

  /**
   * Get session object from the instance
   *
   * @returns Session object
   */
  getSessionObject(): SessionObject {
    return this.sessionObject;
  }

  /**
   * Reset session object by resetting data and expiration time

   * @param expirationAfterSeconds Reset expiration time after seconds
   */
  reset(expirationAfterSeconds?: number) {
    this.sessionObject = {
      data: {},
      expire: this.calculateExpireDate(expirationAfterSeconds),
    };
  }

  /**
   * Refresh session expiration time
   *
   * @param expirationAfterSeconds Reset expiration time after seconds
   */
  refresh(expirationAfterSeconds: number) {
    this.sessionObject.expire = this.calculateExpireDate(
      expirationAfterSeconds,
    );
  }

  /**
   * Check if the session is expired
   *
   * @returns true if the session is expired
   */
  isExpired(): boolean {
    return !!this.sessionObject.expire &&
      Date.now() > new Date(this.sessionObject.expire).getTime();
  }

  /**
   * Get session data by key
   *
   * @param key
   * @returns data for the key
   */
  get(key: string): unknown {
    const entry = this.sessionObject.data[key];

    if (entry) {
      const value = entry.value;
      if (entry.flash) {
        delete this.sessionObject.data[key];
      }

      return value;
    } else {
      return null;
    }
  }

  /**
   * Set session data by key
   *
   * @param key Session data key
   * @param value Session data value
   */
  set(key: string, value: unknown) {
    this.sessionObject.data[key] = {
      value,
      flash: false,
    };
  }

  /**
   * Set session data and mark it as flash data to be removed after the next request
   *
   * @param key Session data key
   * @param value Session data value
   */
  flash(key: string, value: unknown) {
    this.sessionObject.data[key] = {
      value,
      flash: true,
    };
  }

  private calculateExpireDate(expirationAfterSeconds: number | undefined) {
    if (expirationAfterSeconds) {
      const date = new Date(Date.now() + expirationAfterSeconds * 1000);
      return date.toISOString();
    } else {
      return null;
    }
  }
}
