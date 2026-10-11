import { useAuth } from "@/hooks/useAuth";

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { signInWithGoogle } = useAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[320px] text-center shadow-xl">
        <h2 className="text-lg font-semibold mb-4">
          Please login to continue
        </h2>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mb-3"
        >
          Continue with Google
        </button>

        <p className="text-xs text-gray-500 mb-3">
          By continuing, you agree to our{" "}
          <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">Terms of Use</a>{" "}
          and{" "}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">Privacy Policy</a>.
        </p>

        <button
          onClick={onClose}
          className="text-gray-500 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}