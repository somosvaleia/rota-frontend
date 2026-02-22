import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RequireAuth({ children }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const has = !!data.session;
      setOk(has);
      setReady(true);

      if (!has) window.location.href = "/login";
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const has = !!session;
      setOk(has);
      setReady(true);
      if (!has) window.location.href = "/login";
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <div className="p-6 text-zinc-200">Carregando…</div>;
  if (!ok) return <div className="p-6 text-zinc-200">Redirecionando…</div>;

  return children;
}
