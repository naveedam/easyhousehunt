import { getCurrentUser, signInWithGoogle } from "./auth";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    await signInWithGoogle();
    return null;
  }

  return user;
}