import type { MiddlewareHandler, Plugin } from "../deps.ts";
import { sessionMiddleware, type SessionOptions } from "./middleware.ts";

/**
 * Fresh Session Plugin
 * Creates a session plugin with the specified options.
 *
 * @param options The options to configure the session middleware.
 * @returns The configured session plugin.
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
