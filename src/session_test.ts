import { assert, assertEquals, assertFalse } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { assertType, type IsExact } from "@std/testing/types";

import type { SessionState } from "./session.ts";
import { Session } from "./session.ts";
import type { JsonCompatible, JsonValue } from "./json.ts";

describe("Session", () => {
  describe("constructor", () => {
    it("should set passed session object to property", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: new Date().toISOString(),
      });

      const state = session.getState();

      assertEquals(state.data.test.value, "this_is_session_data");
      assertEquals(state.data.test.flash, true);
      assertEquals(state.expire, new Date().toISOString());
    });

    it("should set the default values to property", () => {
      const session = new Session();

      const state = session.getState();

      assertEquals(state.data, {});
      assertEquals(state.expire, null);
    });
  });

  describe("setState", () => {
    it("should set the session object correctly", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const state: SessionState = {
        data: { test: { value: "this_is_session_data", flash: false } },
        expire: new Date().toISOString(),
      };

      const session = new Session();
      session.setState(state);

      const result = session.getState();

      assertEquals(state.data.test.value, "this_is_session_data");
      assertEquals(result.expire, new Date().toISOString());
    });
  });

  describe("getState", () => {
    it("should get the session object correctly", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: new Date().toISOString(),
      });

      const state = session.getState();

      assertEquals(state.data.test.value, "this_is_session_data");
      assertEquals(state.data.test.flash, true);
      assertEquals(state.expire, new Date().toISOString());
    });
  });

  describe("reset", () => {
    it("should reset the session object correctly with expiration time", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: new Date().toISOString(),
      });

      session.reset(60);

      const state = session.getState();

      assertEquals(state.data, {});
      assertEquals(state.expire, "2222-02-02T00:01:00.000Z");
    });

    it("should reset the session object correctly without expiration time", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: new Date().toISOString(),
      });

      session.reset();

      const state = session.getState();

      assertEquals(state.data, {});
      assertEquals(state.expire, null);
    });
  });

  describe("refresh", () => {
    it("should refresh the session and set new expiration time", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: new Date().toISOString(),
      });

      session.refresh(60);

      const state = session.getState();

      assertEquals(state.expire, "2222-02-02T00:01:00.000Z");
    });
  });

  describe("isExpired", () => {
    it("should return false when session is not expired", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: "2222-02-02T00:01:00.000Z",
      });

      assertFalse(session.isExpired());
    });

    it("should return true when session is not expired", () => {
      using _time = new FakeTime("2222-02-02T00:02:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: "2222-02-02T00:01:00.000Z",
      });

      assert(session.isExpired());
    });

    it("should return false when expire is not set in session", () => {
      using _time = new FakeTime("2222-02-02T00:00:00.000Z");

      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: null,
      });

      assertFalse(session.isExpired());
    });
  });

  describe("get", () => {
    it("should return the value of the key and it remains in session when flash flag is off", () => {
      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: false } },
        expire: null,
      });

      const result = session.get("test");
      const result2 = session.get("test");

      assertEquals(result, "this_is_session_data");
      assertEquals(result2, "this_is_session_data");
    });

    it("should return the value of the key and delete it when flash flag on", () => {
      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: null,
      });

      const result = session.get("test");
      const result2 = session.get("test");

      assertEquals(result, "this_is_session_data");
      assertEquals(result2, null);
    });

    it("should return null when the key does not exist", () => {
      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: true } },
        expire: null,
      });

      const result = session.get("not_exist");

      assertEquals(result, null);
    });

    it("should return JsonValue type if type parameter is not provided", () => {
      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: false } },
        expire: null,
      });

      const result = session.get("test");

      assertType<IsExact<typeof result, JsonValue>>(true);
    });

    it("should accept primitive type parameter and return the same type of them", () => {
      const session = new Session({
        data: {
          testStr: { value: "this_is_session_data", flash: false },
          testNum: { value: 123, flash: false },
          testBool: { value: false, flash: false },
        },
        expire: null,
      });

      const resultStr = session.get<string>("testStr");
      const resultNum = session.get<number>("testNum");
      const resultBool = session.get<boolean>("testBool");

      assertType<IsExact<typeof resultStr, string | null>>(true);
      assertType<IsExact<typeof resultNum, number | null>>(true);
      assertType<IsExact<typeof resultBool, boolean | null>>(true);
    });

    it("should accept object and array type parameter and return the same type of them", () => {
      const obj = { key: "value" };
      const arr = ["a", "b"];

      const session = new Session({
        data: {
          testObj: { value: obj, flash: false },
          testArr: { value: arr, flash: false },
        },
        expire: null,
      });

      const resultObj = session.get<typeof obj>("testObj");
      const resultArr = session.get<typeof arr>("testArr");

      assertType<IsExact<typeof resultObj, { key: string } | null>>(true);
      assertType<IsExact<typeof resultArr, string[] | null>>(true);
    });

    it("should accept pre-defined type parameter and return the same type of them", () => {
      type User = { id: number; name: string };
      type Role = "admin" | "user";

      const user: User = { id: 1, name: "test" };
      const role: Role = "admin";

      const session = new Session({
        data: {
          user: { value: user, flash: false },
          role: { value: role, flash: false },
        },
        expire: null,
      });

      const resultUser = session.get<User>("user");
      const resultRole = session.get<Role>("role");

      assertType<IsExact<typeof resultUser, User | null>>(true);
      assertType<IsExact<typeof resultRole, Role | null>>(true);
    });

    it("should accept pre-defined interface type parameter if wrapped in JsonCompatible and return the same type of them", () => {
      interface User {
        id: number;
        name: string;
        role: "admin" | "user";
      }

      const user: User = {
        id: 1,
        name: "test",
        role: "admin",
      };

      const session = new Session({
        data: {
          user: { value: (user as JsonCompatible<User>), flash: false },
        },
        expire: null,
      });

      const resultUser = session.get<JsonCompatible<User>>("user");

      assertType<IsExact<typeof resultUser, User | null>>(true);
    });
  });

  describe("set", () => {
    it("should set the value of the key and flash flag is off", () => {
      const session = new Session();

      session.set("test", "new_data");

      const result = session.get("test");
      const result2 = session.get("test");

      assertEquals(result, "new_data");
      assertEquals(result2, "new_data");
    });

    it("should accept primitive type parameter", () => {
      const session = new Session();

      session.set<string>("testStr", "test");
      session.set<number>("testNum", 123);
      session.set<boolean>("testBool", true);

      const resultStr = session.get<string>("testStr");
      const resultNum = session.get<number>("testNum");
      const resultBool = session.get<boolean>("testBool");

      assertEquals(resultStr, "test");
      assertEquals(resultNum, 123);
      assertEquals(resultBool, true);
    });

    it("should accept object and array type parameter", () => {
      const obj = { key: "value" };
      const arr = ["a", "b"];

      const session = new Session();

      session.set<typeof obj>("testObj", obj);
      session.set<typeof arr>("testArr", arr);

      const resultObj = session.get<typeof obj>("testObj");
      const resultArr = session.get<typeof arr>("testArr");

      assertEquals(resultObj, obj);
      assertEquals(resultArr, arr);
    });

    it("should accept pre-defined type parameter", () => {
      type User = { id: number; name: string };
      type Role = "admin" | "user";

      const user: User = { id: 1, name: "test" };
      const role: Role = "admin";

      const session = new Session();

      session.set<User>("user", user);
      session.set<Role>("role", role);

      const resultUser = session.get<User>("user");
      const resultRole = session.get<Role>("role");

      assertEquals(resultUser, user);
      assertEquals(resultRole, role);
    });

    it("should accept pre-defined interface type parameter if type-asserted as JsonCompatible", () => {
      interface User {
        id: number;
        name: string;
        role: "admin" | "user";
      }

      const user: User = {
        id: 1,
        name: "test",
        role: "admin",
      };

      const session = new Session();

      session.set("user", user as JsonCompatible<User>);

      const resultUser = session.get<JsonCompatible<User>>("user");

      assertType<IsExact<typeof resultUser, User | null>>(true);
    });
  });

  describe("flash", () => {
    it("should set the value of the key and flash flag is on", () => {
      const session = new Session({
        data: { test: { value: "this_is_session_data", flash: false } },
        expire: null,
      });

      session.flash("test", "new_data");

      const result = session.get("test");
      const result2 = session.get("test");

      assertEquals(result, "new_data");
      assertEquals(result2, null);
    });

    it("should accept primitive type parameter", () => {
      const session = new Session();

      session.flash<string>("testStr", "test");
      session.flash<number>("testNum", 123);
      session.flash<boolean>("testBool", true);

      const resultStr = session.get<string>("testStr");
      const resultNum = session.get<number>("testNum");
      const resultBool = session.get<boolean>("testBool");

      assertEquals(resultStr, "test");
      assertEquals(resultNum, 123);
      assertEquals(resultBool, true);
    });

    it("should accept object and array type parameter", () => {
      const obj = { key: "value" };
      const arr = ["a", "b"];

      const session = new Session();

      session.flash<typeof obj>("testObj", obj);
      session.flash<typeof arr>("testArr", arr);

      const resultObj = session.get<typeof obj>("testObj");
      const resultArr = session.get<typeof arr>("testArr");

      assertEquals(resultObj, obj);
      assertEquals(resultArr, arr);
    });

    it("should accept pre-defined type parameter", () => {
      type User = { id: number; name: string };
      type Role = "admin" | "user";

      const user: User = { id: 1, name: "test" };
      const role: Role = "admin";

      const session = new Session();

      session.flash<User>("user", user);
      session.flash<Role>("role", role);

      const resultUser = session.get<User>("user");
      const resultRole = session.get<Role>("role");

      assertEquals(resultUser, user);
      assertEquals(resultRole, role);
    });

    it("should accept pre-defined interface type parameter if type-asserted as JsonCompatible", () => {
      interface User {
        id: number;
        name: string;
        role: "admin" | "user";
      }

      const user: User = {
        id: 1,
        name: "test",
        role: "admin",
      };

      const session = new Session();

      session.flash("user", user as JsonCompatible<User>);

      const resultUser = session.get<JsonCompatible<User>>("user");

      assertType<IsExact<typeof resultUser, User | null>>(true);
    });
  });
});
