import { auth } from "@/lib/auth";

export const signIn = async (email: string, password: string) => {
    try {
        const result = await auth.api.signInEmail({
            body: {
                email,
                password
            }
        });
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Sign in failed" };
    }
};

export const signUp = async (email: string, password: string, name: string) => {
    try {
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        });
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Sign up failed" };
    }
};

export const signOut = async () => {
    try {
        await auth.api.signOut({
            headers: {}
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Sign out failed" };
    }
};