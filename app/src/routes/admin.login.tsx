import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
export const Route = createFileRoute("/admin/login")({ component: Login });
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((s) => {
        setReady(s.configured);
        if (s.authenticated) window.location.replace("/admin");
      })
      .catch(() => setError("Não foi possível verificar o acesso."));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MR-Admin": "1" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Não foi possível iniciar sessão.");
      setPassword("");
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de ligação.");
      setBusy(false);
    }
  }
  return (
    <div className="admin-root admin-login">
      <div className="admin-login-card">
        <a href="/" aria-label="Voltar ao site">
          <img src="/assets/logo.png" alt="MR Memorie Photography" />
        </a>
        <p className="admin-eyebrow">ÁREA PRIVADA</p>
        <h1>Bem-vindo de volta.</h1>
        <p>Entre para cuidar das suas memórias.</p>
        {ready === false && (
          <div role="status" className="admin-notice">
            O painel está preparado. Falta configurar o acesso nas definições do site.
          </div>
        )}
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Palavra-passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button className="admin-primary" disabled={busy || ready !== true}>
            {busy ? "A entrar..." : "Iniciar sessão"}
          </button>
        </form>
        <a className="admin-back" href="/">
          ← Voltar ao site
        </a>
      </div>
    </div>
  );
}
