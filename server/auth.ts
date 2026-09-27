// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation
// Google OAuth was added per Convex Auth's documented configuration
// (https://labs.convex.dev/auth/config/oauth/google): the provider reads
// AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from Convex env vars, and the
// OAuth callback routes through auth.addHttpRoutes(http) in http.ts.

import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { emailOtp } from "./auth/emailOtp";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [emailOtp, Anonymous, Google],
});
