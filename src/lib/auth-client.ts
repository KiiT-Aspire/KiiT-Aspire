import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    fetchOptions: {
        onError: (ctx) => {
            console.error("Auth client error:", ctx.error);
        },
        onSuccess: (ctx) => {
            console.log("Auth client success:", ctx.response);
        }
    }
})