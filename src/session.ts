/**
 * Session state to be stored in a storage and used as in-memory cache
 */
export interface SessionState {
  /**
   * Data type representing a record of session data.
   * Each key is a string and the value is an object containing:
   * - value: The actual data to be stored.
   * - flash: A boolean indicating if the data should be removed after being read once.
   */
  data: Record<string, { value: unknown; flash: boolean }>;

  /**
   * Expire type representing the expiration time of a session.
   * It can be a string in ISO 8601 format or null if the session does not expire.
   */
  expire: string | null;
}

/**
 * A class to manage session state.
 */
export class Session {
  /**
   * Session state to be used as in-memory cache and stored in a storage.
   */
  private state: SessionState;

  /**
   * Constructor
   *
   * @param initialState - Session state to be used as in-memory cache and stored in a storage. If not provided, an empty session state is initialized.
   */
  constructor(initialState?: SessionState) {
    if (initialState) {
      this.state = initialState;
    } else {
      this.state = {
        data: {},
        expire: null,
      };
    }
  }

  /**
   * Set session state in the session instance as in-memory cache.
   *
   * @param value - Object representing the session state.
   */
  setState(value: SessionState) {
    this.state = value;
  }

  /**
   * Get session state from the session instance.
   *
   * @returns Session state cached in the session instance.
   */
  getState(): SessionState {
    return this.state;
  }

  /**
   * Reset session state in the session instance by resetting data and expiration time.

   * @param expirationAfterSeconds - Reset expiration time after seconds.
   */
  reset(expirationAfterSeconds?: number) {
    this.state = {
      data: {},
      expire: this.calculateExpireDate(expirationAfterSeconds),
    };
  }

  /**
   * Refresh session expiration time.
   *
   * @param expirationAfterSeconds - Reset expiration time after seconds.
   */
  refresh(expirationAfterSeconds: number) {
    this.state.expire = this.calculateExpireDate(
      expirationAfterSeconds,
    );
  }

  /**
   * Check if the session is expired.
   *
   * @returns true if the session is expired.
   */
  isExpired(): boolean {
    return !!this.state.expire &&
      Date.now() > new Date(this.state.expire).getTime();
  }

  /**
   * Get session data by key.
   *
   * @param key - Session data key.
   * @returns Data for the key.
   */
  get(key: string): unknown {
    const entry = this.state.data[key];

    if (entry) {
      const value = entry.value;
      if (entry.flash) {
        delete this.state.data[key];
      }

      return value;
    } else {
      return null;
    }
  }

  /**
   * Set session data by key.
   *
   * @param key - Session data key.
   * @param value - Session data value.
   */
  set(key: string, value: unknown) {
    this.state.data[key] = {
      value,
      flash: false,
    };
  }

  /**
   * Set session data and mark it as flash data to be removed after the next request.
   *
   * @param key - Session data key.
   * @param value - Session data value.
   */
  flash(key: string, value: unknown) {
    this.state.data[key] = {
      value,
      flash: true,
    };
  }

  /**
   * Calculate the expiration date based on the given number of seconds.
   *
   * @param expirationAfterSeconds - The number of seconds after which the session should expire. If undefined, it returns null.
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
