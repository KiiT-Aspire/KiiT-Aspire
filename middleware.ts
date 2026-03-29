import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Dashboard routes that require teacher authentication
const isTeacherRoute = createRouteMatcher([
  "/interview(.*)",
  "/analytics(.*)",
  "/settings(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Student interview route — always public, no Clerk auth needed
const isStudentRoute = createRouteMatcher([
  "/interviewee(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Student routes are fully public — students only enter name/email
  if (isStudentRoute(request)) {
    return NextResponse.next();
  }

  // Protect all teacher/dashboard routes
  if (isTeacherRoute(request)) {
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