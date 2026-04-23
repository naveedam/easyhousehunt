import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthDebug() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 text-xs rounded shadow">
      {user ? (
        <>
          <div>✅ Logged in</div>
          <div>{user.email}</div>
          <button
            onClick={handleLogout}
            className="mt-2 text-red-400"
          >
            Logout
          </button>
        </>
      ) : (
        <div>❌ Not logged in</div>
      )}
    </div>
  );
}