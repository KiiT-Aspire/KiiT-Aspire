import { NextRequest, NextResponse } from "next/server";

const allowedHeaders = [
	"Content-Type",
	"Authorization",
	"X-Requested-With",
	"Accept",
	"Origin",
	"Referer",
	"User-Agent",
	"Sec-Fetch-Mode",
	"Sec-Fetch-Site",
	"Sec-Fetch-Dest",
	"Access-Control-Allow-Credentials",
].join(", ");

export async function middleware(request: NextRequest) {
	const origin = request.headers.get("origin");
	const allowOrigin = origin || "*";

	// Add CORS headers for everything
	if (request.method === "OPTIONS") {
		const response = new NextResponse(null, { status: 204 });
		response.headers.set("Access-Control-Allow-Origin", allowOrigin);
		response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		response.headers.set("Access-Control-Allow-Headers", allowedHeaders);
		response.headers.set("Access-Control-Allow-Credentials", "true");
		response.headers.set("Vary", "Origin");
		return response;
	}
	const response = NextResponse.next();
	response.headers.set("Access-Control-Allow-Origin", allowOrigin);
	response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	response.headers.set("Access-Control-Allow-Headers", allowedHeaders);
	response.headers.set("Access-Control-Allow-Credentials", "true");
	response.headers.set("Vary", "Origin");
	return response;
}

export const config = {
	matcher: [
		// Exclude authentication routes from middleware
		"/((?!api/access|api/auth|_next/static|_next/image|favicon.ico).*)"
	], 
};