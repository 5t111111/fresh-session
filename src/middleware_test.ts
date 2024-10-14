import {
  assert,
  assertEquals,
  assertExists,
  assertMatch,
  assertRejects,
} from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";

import { session } from "./middleware.ts";
import { decrypt, encrypt } from "./crypt.ts";
import type { SessionState } from "./session.ts";
import { Session } from "./session.ts";

describe("sessionMiddleware", () => {
  describe("handler", () => {
    const next = () => {
      return new Response();
    };

    // deno-lint-ignore no-explicit-any
    const ctx = { state: {}, next } as any;
    const encryptionKey = "x".repeat(32);
    const state: SessionState = {
      data: { test: { value: "this_is_session_data", flash: false } },
      expire: null,
    };

    it("should throw an error when encryption key is not long enough", async () => {
      const req = new Request("https://example.com", {
        headers: new Headers([
          ["cookie", `session=${await encrypt(encryptionKey, "{}")}`],
        ]),
      });
      const resultPromise = session({ encryptionKey: "x".repeat(31) })({
        ...ctx,
        req,
      }) as Promise<Response>;

      await assertRejects(() => resultPromise);
    });

    it("should not create a new session, just refresh it when session exists and not expired", async () => {
      using time = new FakeTime("2222-02-02T00:00:00.000Z");

      using getStateSpy = spy(Session.prototype, "getState");
      using setStateSpy = spy(Session.prototype, "setState");
      using refreshSpy = spy(Session.prototype, "refresh");

      const encryptedData = await encrypt(
        encryptionKey,
        JSON.stringify(state),
      );

      const req = new Request("https://example.com", {
        headers: new Headers([
          ["cookie", `session=${encryptedData}`],
        ]),
      });

      time.tick(1000);

      const result = await session({
        encryptionKey,
        expireAfterSeconds: 60,
      })({ ...ctx, req });

      const setCookieHeader = result.headers.get("set-cookie");
      const cookieName = setCookieHeader?.split("=")[0];
      const cookieValue = JSON.parse(
        await decrypt(
          encryptionKey,
          setCookieHeader?.split("=")[1]!,
        ) as string,
      );

      assertSpyCalls(getStateSpy, 1);
      assertSpyCalls(setStateSpy, 1);
      assertSpyCalls(refreshSpy, 1);
      assertEquals(refreshSpy.calls[0].args[0], 60);
      assertEquals(result.headers.has("set-cookie"), true);
      assertEquals(cookieName, "session");
      assertEquals(cookieValue.data.test.value, "this_is_session_data");
      assertEquals(cookieValue.data.test.flash, false);
      assertEquals(cookieValue.expire, "2222-02-02T00:01:01.000Z");
    });

    it("should reset session when session exists but expired", async () => {
      using time = new FakeTime("2222-02-02T00:00:00.000Z");

      using getStateSpy = spy(Session.prototype, "getState");
      using refreshSpy = spy(Session.prototype, "refresh");
      using resetSpy = spy(Session.prototype, "reset");

      const encryptedData = await encrypt(
        encryptionKey,
        JSON.stringify({
          ...state,
          expire: "2222-02-02T00:01:00.000Z",
        }),
      );

      const req = new Request("https://example.com", {
        headers: new Headers({
          "cookie": `session=${encryptedData}`,
        }),
      });

      // 70 seconds after to make it expired
      time.tick(70000);

      const result = await session({
        encryptionKey,
        expireAfterSeconds: 60,
      })({ ...ctx, req });

      const setCookieHeader = result.headers.get("set-cookie");
      const cookieName = setCookieHeader?.split("=")[0];
      const cookieValue = JSON.parse(
        await decrypt(
          encryptionKey,
          setCookieHeader?.split("=")[1]!,
        ) as string,
      );

      assertSpyCalls(getStateSpy, 1);
      assertSpyCalls(refreshSpy, 0);
      assertEquals(result.headers.has("set-cookie"), true);
      assertSpyCalls(resetSpy, 1);
      assertEquals(resetSpy.calls[0].args[0], 60);
      assertEquals(cookieName, "session");
      assertEquals(cookieValue.data, {});
      assertEquals(cookieValue.expire, "2222-02-02T00:02:10.000Z");
    });

    it("should create a new session with expire when session does not exist", async () => {
      using time = new FakeTime("2222-02-02T00:00:00.000Z");

      using refreshSpy = spy(Session.prototype, "refresh");
      using resetSpy = spy(Session.prototype, "reset");

      time.tick(1000);

      const req = new Request("https://example.com", {
        headers: new Headers(),
      });

      const result = await session({
        encryptionKey,
        expireAfterSeconds: 60,
      })({ ...ctx, req });

      const setCookieHeader = result.headers.get("set-cookie");
      const cookieName = setCookieHeader?.split("=")[0];
      const cookieValue = JSON.parse(
        await decrypt(
          encryptionKey,
          setCookieHeader?.split("=")[1]!,
        ) as string,
      );

      assertSpyCalls(refreshSpy, 0);
      assertEquals(result.headers.has("set-cookie"), true);
      assertSpyCalls(resetSpy, 1);
      assertEquals(resetSpy.calls[0].args[0], 60);
      assertEquals(cookieName, "session");
      assertEquals(cookieValue.data, {});
      assertEquals(cookieValue.expire, "2222-02-02T00:01:01.000Z");
    });

    it("should create a new session without expire when session does not exist", async () => {
      using refreshSpy = spy(Session.prototype, "refresh");
      using resetSpy = spy(Session.prototype, "reset");

      const req = new Request("https://example.com", {
        headers: new Headers(),
      });

      const result = await session({
        encryptionKey,
      })({ ...ctx, req });

      const setCookieHeader = result.headers.get("set-cookie");
      const cookieName = setCookieHeader?.split("=")[0];
      const cookieValue = JSON.parse(
        await decrypt(
          encryptionKey,
          setCookieHeader?.split("=")[1]!,
        ) as string,
      );

      assertSpyCalls(refreshSpy, 0);
      assertEquals(result.headers.has("set-cookie"), true);
      assertSpyCalls(resetSpy, 1);
      assertEquals(resetSpy.calls[0].args[0], undefined);
      assertEquals(cookieName, "session");
      assertEquals(cookieValue.data, {});
      assertEquals(cookieValue.expire, null);
    });

    it("should set session object into context state", async () => {
      const req = new Request("https://example.com", {
        headers: new Headers(),
      });

      await session({
        encryptionKey,
      })({ ...ctx, req });

      assertExists(ctx.state.session);
      assertEquals(ctx.state.session instanceof Session, true);
      assertEquals(ctx.state.session.getState().data, {});
      assertEquals(ctx.state.session.getState().expire, null);
    });

    it("should merge set-cookie header with headers from next handler", async () => {
      const encryptedData = await encrypt(
        encryptionKey,
        JSON.stringify(state),
      );

      const req = new Request("https://example.com", {
        headers: new Headers([
          ["cookie", `session=${encryptedData}`],
        ]),
      });

      const result = await session({
        encryptionKey,
      })({
        ...ctx,
        req,
        next: () =>
          new Response(null, {
            headers: new Headers([
              ["key1", "value1"],
              ["key2", "value2"],
              ["set-cookie", "othercookie=somevalue"],
            ]),
          }),
      });

      assert(result.headers.has("key1"));
      assertEquals(result.headers.get("key1"), "value1");
      assert(result.headers.has("key2"));
      assertEquals(result.headers.get("key2"), "value2");
      assert(result.headers.has("set-cookie"));
      const setCookieHeaders = result.headers.getSetCookie();
      assertEquals(setCookieHeaders.length, 2);
      assertEquals(setCookieHeaders[0], "othercookie=somevalue");
      assertMatch(setCookieHeaders[1], /^session=/);
    });
  });
});
