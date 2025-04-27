import { NextResponse } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isClientRoute = createRouteMatcher(["/client(.*)"])
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Get the current user's session
  const session = await auth()
  
  // If not authenticated, redirect to home
  if (!session.userId) {
    const url = new URL("/", req.url)
    return NextResponse.redirect(url)
  }

  // Protect all routes starting with `/admin`
  if (
    isAdminRoute(req) &&
    session.sessionClaims?.metadata?.role !== "admin"
  ) {
    const url = new URL("/", req.url)
    return NextResponse.redirect(url)
  }

  // Protect all routes starting with `/client`
  if (isClientRoute(req) && !session.userId) {
    const url = new URL("/", req.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
