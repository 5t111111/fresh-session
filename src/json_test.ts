import { describe, it } from "@std/testing/bdd";
import { assertType, type Has, type IsExact } from "@std/testing/types";
import type { JsonCompatible, JsonObject, JsonValue } from "./json.ts";

describe("JsonValue", () => {
  it("should be a string", () => {
    assertType<Has<JsonValue, string>>(true);
  });

  it("should be a number", () => {
    assertType<Has<JsonValue, number>>(true);
  });

  it("should be a boolean", () => {
    assertType<Has<JsonValue, boolean>>(true);
  });

  it("should be null", () => {
    assertType<Has<JsonValue, null>>(true);
  });

  it("should be JsonValue", () => {
    assertType<Has<JsonValue, JsonObject>>(true);
  });

  it("should be an array of JsonValue", () => {
    assertType<Has<JsonValue, JsonValue[]>>(true);
  });

  it("should not be undefined", () => {
    assertType<Has<JsonValue, undefined>>(false);
  });

  it("should be an array of string", () => {
    const _: JsonValue = ["a", "b"];
  });

  it("should be an array of number", () => {
    const _: JsonValue = [1, 2];
  });

  it("should be an array of array", () => {
    const _: JsonValue = [["a", "b"], [3, 4]];
  });

  it("should be an object with serializable properties", () => {
    const _: JsonValue = {
      key: "value",
      nested: {
        key: "value",
      },
    };
  });

  it("should be an array of objects with serializable properties", () => {
    const _: JsonValue = [{
      key: "value",
      nested: {
        key: "value",
      },
    }];
  });

  it("should be an object with pre-defined type", () => {
    type User = { id: number; name: string };
    const user: User = { id: 123, name: "test" };
    const _: JsonValue = user;
  });
});

describe("JsonObject", () => {
  it("should be an object with string properties", () => {
    const _: JsonObject = {
      key1: "value1",
      key2: 123,
      nested1: {
        key3: true,
        nested2: {
          key4: null,
        },
      },
    };
  });
});

describe("JsonCompatible", () => {
  it("should accept string as type parameter", () => {
    type JsonCompatibleType = JsonCompatible<string>;

    assertType<IsExact<JsonCompatibleType, string>>(true);
  });

  it("should accept number as type parameter", () => {
    type JsonCompatibleType = JsonCompatible<number>;

    assertType<IsExact<JsonCompatibleType, number>>(true);
  });

  it("should accept boolean as type parameter", () => {
    type JsonCompatibleType = JsonCompatible<boolean>;

    assertType<IsExact<JsonCompatibleType, boolean>>(true);
  });

  it("should accept null as type parameter", () => {
    type JsonCompatibleType = JsonCompatible<null>;

    assertType<IsExact<JsonCompatibleType, null>>(true);
  });

  it("should accept array as type parameter", () => {
    type JsonCompatibleType = JsonCompatible<string[]>;

    assertType<IsExact<JsonCompatibleType, string[]>>(true);
  });

  it("should accept object type as type parameter", () => {
    type JsonCompatibleType = JsonCompatible<{ key: string }>;

    assertType<IsExact<JsonCompatibleType, { key: string }>>(true);
  });

  it("should accept pre-defined object type as type parameter", () => {
    type User = { id: number; name: string; getName: () => string };
    type JsonCompatibleType = JsonCompatible<User>;

    assertType<
      IsExact<JsonCompatibleType, (Omit<User, "getName"> & { getName: never })>
    >(true);
  });

  it("should accept pre-defined interface type as type parameter", () => {
    interface User {
      id: number;
      name: string;
      getName: () => string;
    }
    type JsonCompatibleType = JsonCompatible<User>;

    assertType<
      IsExact<JsonCompatibleType, (Omit<User, "getName"> & { getName: never })>
    >(true);
  });

  it("should accept non-serializable type as type parameter, but it become never", () => {
    type JsonCompatibleType1 = JsonCompatible<bigint>;
    type JsonCompatibleType2 = JsonCompatible<symbol>;
    type JsonCompatibleType3 = JsonCompatible<() => void>;

    assertType<IsExact<JsonCompatibleType1, never>>(true);
    assertType<IsExact<JsonCompatibleType2, never>>(true);
    assertType<IsExact<JsonCompatibleType3, never>>(true);
  });
});

/*******************************************************************************
 * The following is commented out because the expected behavior is for it to
 * fail compilation due to a type error.
 ******************************************************************************/
// describe("JsonValue (Error)", () => {
//   it("should not be an object with Date properties", () => {
//     const _: JsonValue = {
//       key: "value",
//       nested: {
//         key: new Date(),
//       },
//     };
//   });

//   it("should not be an object with function properties", () => {
//     const _: JsonValue = {
//       key: "value",
//       nested: {
//         key: () => {},
//       },
//     };
//   });

//   it("should not be an object with regexp properties", () => {
//     const _: JsonValue = {
//       key: "value",
//       nested: {
//         key: /value/,
//       },
//     };
//   });

//   it("should not be an object with BigInt properties", () => {
//     const _: JsonValue = {
//       key: "value",
//       nested: {
//         key: BigInt(123),
//       },
//     };
//   });

//   it("should not be an object with pre-defined interface", () => {
//     interface User {
//       id: number;
//       name: string;
//     }
//     const user: User = { id: 123, name: "test" };
//     const _: JsonValue = user;
//   });
// });
