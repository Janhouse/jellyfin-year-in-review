import { createAuthClient } from "better-auth/react";

// better-auth 1.7 removed the `genericOAuthClient` plugin: generic-oauth
// providers are now registered as first-class social providers on the server,
// so they go through the core `signIn.social` / `callback/:id` endpoints.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
