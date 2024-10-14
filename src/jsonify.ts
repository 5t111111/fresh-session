/**
 * This is adapted from the Remix's internal TypeScript utility types.
 * Remix uses this to infer the shape of the data sent over the network.
 * We use it as that is also useful to ensure that the data is serializable to JSON.
 *
 * @see {@link https://github.com/remix-run/remix/blob/308788f3bfe9c3ebb2ee6ae564865e328e8febd2/packages/remix-server-runtime/jsonify.ts|remix-server-runtime/jsonify.ts}
 */

// `Jsonify` emulates `let y = JSON.parse(JSON.stringify(x))`, but for types
// so that we can infer the shape of the data sent over the network.
export type Jsonify<T> =
  // any
  // deno-lint-ignore no-explicit-any
  IsAny<T> extends true ? any
    // toJSON
    : T extends { toJSON(): infer U } ? (U extends JsonValue ? U : unknown)
    // primitives
    : T extends JsonPrimitive ? T
    // deno-lint-ignore ban-types
    : T extends String ? string
    // deno-lint-ignore ban-types
    : T extends Number ? number
    // deno-lint-ignore ban-types
    : T extends Boolean ? boolean
    // Promises JSON.stringify to an empty object
    : T extends Promise<unknown> ? EmptyObject
    // Map & Set
    : T extends Map<unknown, unknown> ? EmptyObject
    : T extends Set<unknown> ? EmptyObject
    // TypedArray
    : T extends TypedArray ? Record<string, number>
    // Not JSON serializable
    : T extends NotJson ? never
    // tuple & array
    : T extends [] ? []
    : T extends readonly [infer F, ...infer R]
      ? [NeverToNull<Jsonify<F>>, ...Jsonify<R>]
    : T extends readonly unknown[] ? Array<NeverToNull<Jsonify<T[number]>>>
    // object
    : T extends Record<keyof unknown, unknown> ? JsonifyObject<T>
    // unknown
    : unknown extends T ? unknown
    : never;

// value is always not JSON => true
// value is always JSON => false
// value is sometimes JSON, sometimes not JSON => boolean
// note: cannot be inlined as logic requires union distribution
type ValueIsNotJson<T> = T extends NotJson ? true : false;

// note: remove optionality so that produced values are never `undefined`,
// only `true`, `false`, or `boolean`
type IsNotJson<T> = { [K in keyof T]-?: ValueIsNotJson<T[K]> };

type JsonifyValues<T> = { [K in keyof T]: Jsonify<T[K]> };

type JsonifyObject<T extends Record<keyof unknown, unknown>> =
  // required
  & {
    [
      K in keyof T as unknown extends T[K] ? never
        : IsNotJson<T>[K] extends false ? K
        : never
    ]: JsonifyValues<T>[K];
  }
  & // optional
  {
    [
      K in keyof T as unknown extends T[K] ? K
        // if the value is always JSON, then it's not optional
        : IsNotJson<T>[K] extends false ? never
        // if the value is always not JSON, omit it entirely
        : IsNotJson<T>[K] extends true ? never
        // if the value is mixed, then it's optional
        : K
    ]?: JsonifyValues<T>[K];
  };

// types ------------------------------------------------------------

type JsonPrimitive = string | number | boolean | null;

type JsonArray = JsonValue[] | readonly JsonValue[];

type JsonObject =
  & { [K in string]: JsonValue }
  & { [K in string]?: JsonValue };

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type NotJson = undefined | symbol | AnyFunction;

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

// utils ------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type AnyFunction = (...args: any[]) => unknown;

type NeverToNull<T> = [T] extends [never] ? null : T;

// adapted from https://github.com/sindresorhus/type-fest/blob/main/source/empty-object.d.ts
declare const emptyObjectSymbol: unique symbol;
export type EmptyObject = { [emptyObjectSymbol]?: never };

// adapted from https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
type IsAny<T> = 0 extends 1 & T ? true : false;
