import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  if (!open) return null;

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // important for Vercel
        queryParams: {
          prompt: "select_account", // ✅ FORCE account picker
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white text-black p-6 rounded-xl w-[320px] text-center shadow-xl">
        <h2 className="text-lg font-semibold mb-4">
          Please login to continue
        </h2>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mb-3"
        >
          Continue with Google
        </button>

        <button
          onClick={onClose}
          className="text-gray-600 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}