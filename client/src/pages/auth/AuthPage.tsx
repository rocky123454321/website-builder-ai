import { useParams } from "react-router-dom"
import { AuthView } from "@daveyplate/better-auth-ui"
//check
export default function AuthPage() {
  const { pathname } = useParams()

  return (
    <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      <AuthView pathname={pathname} classNames={{base: 'bg-black/10 ring ring-indigo-900'}}/>
    </main>
  )
}