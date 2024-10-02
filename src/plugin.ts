import type { MiddlewareHandler, Plugin } from "../deps.ts";
import { sessionMiddleware, type SessionOptions } from "./middleware.ts";

/**
 * Plugin for session management
 *
 * @param options
 * @returns Plugin object
 */
export const sessionPlugin = (
  options: SessionOptions,
): Plugin => {
  return {
    name: "sessionPlugin",
    middlewares: [
      {
        middleware: {
          // TODO: workaround to fix type error
          handler: sessionMiddleware(options) as unknown as MiddlewareHandler,
        },
        path: "/",
      },
    ],
  };
};
