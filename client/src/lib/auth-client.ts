import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // No baseURL needed - API calls go to same domain in production
    fetchOption:{credentials: 'include'}
})


export const { signIn, signUp, signOut, useSession } = authClient
