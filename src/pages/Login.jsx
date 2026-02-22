import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setMsg(`Erro no login: ${error.message}`);
    } else {
      setMsg("Te mandei um link no e-mail. Abre ele pra entrar ✅");
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #222", borderRadius: 12, padding: 18 }}>
        <h1 style={{ margin: 0 }}>Rota</h1>
        <p style={{ opacity: 0.8, marginTop: 6 }}>Acesso restrito por e-mail.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <label style={{ fontSize: 13 }}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@dominio.com"
            required
            style={{ padding: 12, borderRadius: 10, border: "1px solid #333", outline: "none" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ padding: 12, borderRadius: 10, border: "1px solid #333", cursor: "pointer", fontWeight: 600 }}
          >
            {loading ? "Enviando…" : "Enviar link de acesso"}
          </button>

          {msg && <div style={{ fontSize: 13 }}>{msg}</div>}
        </form>
      </div>
    </div>
  );
}
