import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      setMsg("Esse e-mail não tem acesso. Me chama pra liberar 😉");
    } else {
      setMsg("Pronto! Te mandei um link no e-mail. Abre ele pra entrar ✅");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h1 className="text-2xl font-bold">Rota</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Acesso restrito. Entre com seu e-mail autorizado.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">E-mail</label>
            <input
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-700"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@dominio.com"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar link de acesso"}
          </button>

          {msg && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
              {msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
