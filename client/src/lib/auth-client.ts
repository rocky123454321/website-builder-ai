import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : '',
    fetchOption:{credentials: 'include'}
})


export const { signIn, signUp, signOut, useSession } = authClient
