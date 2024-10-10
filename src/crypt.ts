import { defaults, seal, unseal } from "@brc-dd/iron";

/**
 * Encrypt a string or object.
 *
 * @param password - Password string at least 32 characters long.
 * @param payload - String or object to encrypt.
 * @returns The encrypted string.
 */
export async function encrypt(
  password: string,
  payload: object | string,
): Promise<string> {
  return await seal(crypto, payload, password, defaults);
}

/**
 * Decrypt an encrypted string.
 *
 * @param password - Password string at least 32 characters long.
 * @param encrypted - Encrypted string.
 * @returns The unencrypted value.
 */
export async function decrypt(
  password: string,
  encrypted: string,
): Promise<unknown> {
  return await unseal(crypto, encrypted, { default: password }, defaults);
}
