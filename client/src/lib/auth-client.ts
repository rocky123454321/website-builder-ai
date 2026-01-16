import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({

    baseURL: import.meta.env.VITE_BASEURL || "",
    fetchOption:{credentials: 'include'}

})


export const { signIn, signUp, signOut, useSession } = authClient
