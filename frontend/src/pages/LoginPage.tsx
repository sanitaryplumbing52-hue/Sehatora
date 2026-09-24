import { Loader2, Lock, Sparkles, User } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-surface-dark px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
            <Sparkles size={22} />
          </div>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Sehatora CRM</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white dark:bg-surface-dark-card dark:border-border-dark p-6 shadow-card space-y-4">
          {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-danger">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200">Username</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-surface-dark dark:border-border-dark"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink dark:text-slate-200">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-surface-dark dark:border-border-dark"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
          </Button>

          <p className="text-center text-xs text-muted">
            Demo: <span className="font-mono">admin</span> / <span className="font-mono">SehatoraDemo#2026</span>
          </p>
        </form>
      </div>
    </div>
  );
}
