import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes (jinpe login zaroori nahi)
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  afterAuth(auth, req, evt) {
    // If user is signed in and tries to access `/` or `/sign-in`, send them to dashboard
    if (auth.userId && (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/sign-in"))) {
      return Response.redirect(new URL("/dashboard", req.url));
    }

    // If user is not signed in and tries to access a protected route
    if (!auth.userId && req.nextUrl.pathname.startsWith("/dashboard")) {
      return Response.redirect(new URL("/sign-in", req.url));
    }
  },
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
