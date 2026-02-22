import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();
      window.location.replace("/dashboard");
    })();
  }, []);

  return <div className="p-6 text-zinc-200">Validando acesso…</div>;
}
