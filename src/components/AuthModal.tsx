import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';
import type { UserAccount } from '../types/agro';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount, idToken: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = credential.user;
      const idToken = await fbUser.getIdToken();
      const account: UserAccount = {
        uid: fbUser.uid,
        name:
          fbUser.displayName ||
          fbUser.email?.split('@')[0] ||
          'AgroPulse Farmer',
        email: fbUser.email || '',
        photoUrl: fbUser.photoURL,
        provider: 'google',
      };
      onAuthSuccess(account, idToken);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or blocked. Please allow popups and try again.';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-sm bg-[#FAFBF9] rounded-2xl border border-[#DCE3DE] shadow-xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5 pt-1">
          <h2 id="auth-modal-title" className="text-xl font-bold text-[#1E293B]">
            Sign in to AgroPulse
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sync your farm profile, crop plan, tasks, plant diagnoses, and assistant threads across
            devices.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-70 py-3 px-4 text-sm font-semibold text-[#1E293B] transition-colors shadow-xs"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#2D6A4F]" aria-hidden="true" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        <div className="mt-4 rounded-xl bg-white border border-[#E5EAE6] p-3 flex items-start gap-2.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Authenticated with Google Sign-In. Your farm records are saved securely per account.
          </span>
        </div>
      </div>
    </div>
  );
}
