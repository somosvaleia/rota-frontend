import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("rota_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  function logout() {
    localStorage.removeItem("rota_user");
    setUser(null);
  }

  if (!user) return <Login onLogin={setUser} />;

  return <Dashboard user={user} onLogout={logout} />;
}
