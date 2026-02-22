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
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!ready) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!ok) return <div style={{ padding: 24 }}>Redirecionando…</div>;

  return children;
}
