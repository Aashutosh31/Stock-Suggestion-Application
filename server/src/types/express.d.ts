import type { UserDoc } from "../modules/users/user.model.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDoc;
      /** True when the request is serving a read-only demo/guest session. */
      isGuest?: boolean;
      /** Parsed + validated query object populated by the validate() middleware. */
      validatedQuery?: unknown;
    }
  }
}

export {};
