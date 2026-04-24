import { supabase } from "@/integrations/supabase/client";

export default function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // 🔥 IMPORTANT
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-xl p-6 w-[350px] text-center shadow-xl">

        <h2 className="text-lg font-semibold mb-4">
          Please login to continue
        </h2>

        {/* 🔥 GOOGLE LOGIN */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded mb-3"
        >
          Continue with Google
        </button>

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}