import { auth, currentUser } from "@clerk/nextjs/server";

export const getAuthUser = async () => {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await currentUser();
    return user;
};