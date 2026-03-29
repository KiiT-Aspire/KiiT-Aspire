import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that are always public — no auth required
const isPublicRoute = createRouteMatcher([
  "/",                   // Landing page
  "/sign-in(.*)",        // Clerk sign-in pages
  "/sign-up(.*)",        // Clerk sign-up pages
  "/interviewee(.*)",    // Students — enter name/email only, no account needed
  "/api/interviews/:id", // Student fetches interview details before starting
  "/api/interviews/(.*)/start",        // Student starts interview session
  "/api/interviews/(.*)/responses(.*)", // Student submits answers
  "/api/audio-upload(.*)",
  "/api/cloudflarerealtime(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};