import { assertEquals, assertExists, assertMatch } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import { CookieStore } from "./cookie_store.ts";
import { decrypt, encrypt } from "./crypt.ts";
import type { SessionState } from "./session.ts";

describe("CookieStore", () => {
  const encryptionKey = "x".repeat(32);
  const state: SessionState = {
    data: { test: { value: "this_is_session_data", flash: false } },
    expire: null,
  };

  describe("constructor", () => {
    it("should set passed options to properties", () => {
      const cookieStore = new CookieStore({
        encryptionKey: "very_secret_key",
        cookieOptions: { path: "/", secure: true },
        sessionCookieName: "test_session",
      });

      assertEquals(cookieStore.encryptionKey, "very_secret_key");
      assertEquals(cookieStore.cookieOptions, { path: "/", secure: true });
      assertEquals(cookieStore.sessionCookieName, "test_session");
    });
  });

  describe("getSession", () => {
    it("should return data stored in session", async () => {
      const cookieStore = new CookieStore({ encryptionKey });

      const encryptedData = await encrypt(
        encryptionKey,
        JSON.stringify(state),
      );

      const req = new Request("https://example.com", {
        headers: new Headers({
          "cookie": `session=${encryptedData}`,
        }),
      });

      const result = await cookieStore.getSession(req);

      assertExists(result);
      assertExists(result.data);
      assertEquals(result.data.test.value, "this_is_session_data");
    });

    it("should return null when session data does not exist in cookies", async () => {
      const cookieStore = new CookieStore({ encryptionKey });

      const req = new Request("https://example.com", {
        headers: new Headers(),
      });

      const result = await cookieStore.getSession(req);

      assertEquals(result, null);
    });

    it("should return null when session data does not exist in cookies", async () => {
      const cookieStore = new CookieStore({ encryptionKey });

      const req = new Request("https://example.com", {
        headers: new Headers(),
      });

      const result = await cookieStore.getSession(req);

      assertEquals(result, null);
    });

    it("should return null when decryption fails", async () => {
      const cookieStore = new CookieStore({ encryptionKey });

      const req = new Request("https://example.com", {
        headers: new Headers({
          "cookie": `session=invalid_encrypted_data`,
        }),
      });

      const result = await cookieStore.getSession(req);

      assertEquals(result, null);
    });

    it("should return null when JSON parse fails", async () => {
      const cookieStore = new CookieStore({ encryptionKey });

      const encryptedData = await encrypt(
        encryptionKey,
        "invalid_json_data",
      );

      const req = new Request("https://example.com", {
        headers: new Headers({
          "cookie": `session=${encryptedData}`,
        }),
      });

      const result = await cookieStore.getSession(req);

      assertEquals(result, null);
    });

    it("should be customizable session cookie name", async () => {
      const cookieStore = new CookieStore({
        encryptionKey,
        sessionCookieName: "custom_session",
      });

      const encryptedData = await encrypt(
        encryptionKey,
        JSON.stringify(state),
      );

      const req = new Request("https://example.com", {
        headers: new Headers({
          "cookie": `custom_session=${encryptedData}`,
        }),
      });

      const result = await cookieStore.getSession(req);

      assertExists(result);
      assertExists(result.data);
      assertEquals(result.data.test.value, "this_is_session_data");
    });
  });

  describe("createSetCookieHeader", () => {
    it("should return headers with set-cookie header with encrypted session data", async () => {
      const cookieStore = new CookieStore({ encryptionKey });

      const headers = new Headers([["key1", "value1"]]);
      const result = await cookieStore.createSetCookieHeader(
        headers,
        state,
      );
      const setCookieHeader = result.get("set-cookie");
      const cookieName = setCookieHeader?.split("=")[0];
      const cookieValue = setCookieHeader?.split("=")[1];
      const existingHeader = result.get("key1");

      assertExists(setCookieHeader);
      assertEquals(cookieName, "session");
      assertExists(cookieValue);
      assertEquals(
        JSON.parse((await decrypt(encryptionKey, cookieValue)) as string),
        state,
      );
      assertEquals(existingHeader, "value1");
    });

    it("should be customizable session cookie name", async () => {
      const cookieStore = new CookieStore({
        encryptionKey,
        sessionCookieName: "custom_session",
      });

      const result = await cookieStore.createSetCookieHeader(
        new Headers(),
        state,
      );
      const setCookieHeader = result.get("set-cookie");
      const cookieName = setCookieHeader?.split("=")[0];

      assertExists(setCookieHeader);
      assertEquals(cookieName, "custom_session");
    });

    it("should be customizable cookie options", async () => {
      const cookieStore = new CookieStore({
        encryptionKey,
        cookieOptions: {
          path: "/test",
          secure: true,
          sameSite: "Strict",
        },
      });

      const result = await cookieStore.createSetCookieHeader(
        new Headers(),
        state,
      );
      const setCookieHeader = result.get("set-cookie");

      assertExists(setCookieHeader);
      assertMatch(setCookieHeader, /Path=\/test/);
      assertMatch(setCookieHeader, /Secure/);
      assertMatch(setCookieHeader, /SameSite=Strict/);
    });
  });
});
