import { db } from "@/db/drizzle";
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { schema } from "@/db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    emailAndPassword: {  
        enabled: true,
        minPasswordLength: 8, // Set minimum password length to 8 characters
        requireEmailVerification: false // Disable email verification for now
    },
    database:drizzleAdapter(db,{
        provider:"pg",
        schema:schema
    }),
    plugins:[
        nextCookies()
    ]
});