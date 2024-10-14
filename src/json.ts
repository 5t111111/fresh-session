/**
 * Type for all values that may be serialized to JSON
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

/**
 * Interface for objects that may be serialized to JSON
 */
interface JsonObject extends Record<string, JsonValue> {}

/**
 * Type for representing any function
 */
// deno-lint-ignore no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

/**
 * Types that are not assignable to JSON
 */
type NotAssignableToJson =
  | bigint
  | symbol
  | AnyFunction;

/**
 * Utility type to make a type compatible with JsonValue by removing non-serializable types
 */
export type JsonCompatible<T> = T extends string | number | boolean | null ? T
  : T extends Array<infer U> ? JsonCompatible<U>[]
  : T extends NotAssignableToJson ? never
  : T extends object ? { [K in keyof T]: JsonCompatible<T[K]> }
  : never;
