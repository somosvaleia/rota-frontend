import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();
      window.location.replace("/dashboard");
    })();
  }, []);

  return <div style={{ padding: 24 }}>Validando acesso…</div>;
}
