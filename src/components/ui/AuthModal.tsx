import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const { signIn, signUp } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (isSignup) {
        await signUp(email, password, fullName);
        alert("Signup successful! Please check your email.");
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    window.location.href = `${
      import.meta.env.VITE_SUPABASE_URL
    }/auth/v1/authorize?provider=google&redirect_to=${
      window.location.origin
    }`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] p-6 rounded-lg w-[400px]">

        <h2 className="text-xl font-semibold mb-4 text-white">
          {isSignup ? "Create Account" : "Login"}
        </h2>

        {isSignup && (
          <input
            placeholder="Full Name"
            className="w-full p-2 mb-3 bg-[#020617] text-white rounded"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          className="w-full p-2 mb-3 bg-[#020617] text-white rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="w-full p-2 mb-3 bg-[#020617] text-white rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 p-2 rounded mb-3"
        >
          {loading
            ? "Please wait..."
            : isSignup
            ? "Sign Up"
            : "Login"}
        </button>

        <button
          onClick={handleGoogle}
          className="w-full bg-white text-black p-2 rounded mb-3"
        >
          Continue with Google
        </button>

        <p
          onClick={() => setIsSignup(!isSignup)}
          className="text-sm text-center text-gray-400 cursor-pointer"
        >
          {isSignup
            ? "Already have an account? Login"
            : "New here? Create account"}
        </p>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
}