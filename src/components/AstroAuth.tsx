import { useState } from "react"
import { astroApi, setToken, removeToken, type AstroUser } from "@/lib/astro-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { User, SignIn, SignOut, UserPlus } from "@phosphor-icons/react"

interface AstroAuthProps {
  user: AstroUser | null
  onUserChange: (user: AstroUser | null) => void
}

export function AstroAuth({ user, onUserChange }: AstroAuthProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === "login") {
        const { token, user } = await astroApi.auth.login({ email, password })
        setToken(token)
        onUserChange(user)
        toast.success(`Welcome back, ${user.username}!`)
      } else {
        const { token, user } = await astroApi.auth.register({ email, password, username })
        setToken(token)
        onUserChange(user)
        toast.success(`Account created! Welcome, ${user.username}!`)
      }
      setOpen(false)
      setEmail("")
      setPassword("")
      setUsername("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    onUserChange(null)
    toast.success("Logged out. Your data is saved to this device.")
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:block">{user.username}</span>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <SignOut weight="bold" />
          Sign Out
        </Button>
      </div>
    )
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <User weight="bold" />
        Sign In
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center gap-2">
          {mode === "login" ? <SignIn size={22} weight="bold" /> : <UserPlus size={22} weight="bold" />}
          <h2 className="text-xl font-semibold">
            {mode === "login" ? "Sign in to sync your charts" : "Create an account"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Your charts will sync across all your devices."
            : "Save your charts and access them from any device."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="astrologer42"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  )
}
