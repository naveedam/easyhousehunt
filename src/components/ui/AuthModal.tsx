import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      alert("Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] p-6 rounded w-[320px] text-center">
        <h2 className="text-lg mb-4">Login required</h2>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black p-2 rounded mb-3"
        >
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>

        <button
          onClick={onClose}
          className="text-sm text-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}