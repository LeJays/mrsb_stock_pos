import React, { useState } from 'react';
import { AuthService } from '../services/auth';
import { UserProfile, UserRole } from '../types';
import { Logo } from './Logo';
import { Lock, Mail, User, Shield, Sparkles, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  isFirebaseOnline?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, isFirebaseOnline = true }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [role, setRole] = useState<UserRole>('caisse');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Veuillez renseigner votre email et mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const profile = await AuthService.loginWithEmail(email, password);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = "Identifiants invalides ou problème de connexion.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Email ou mot de passe incorrect.";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Trop de tentatives échouées. Veuillez patienter ou réinitialiser votre mot de passe.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password || !nom) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      const profile = await AuthService.registerWithEmail(email, password, nom, role);
      setSuccessMsg("Compte créé avec succès ! Connexion en cours...");
      setTimeout(() => {
        onLoginSuccess(profile);
      }, 500);
    } catch (err: any) {
      console.error("Registration error:", err);
      let msg = "Erreur lors de la création du compte.";
      if (err.code === 'auth/email-already-in-use') {
        msg = "Cet email est déjà associé à un compte. Veuillez vous connecter.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Le mot de passe est trop faible.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const profile = await AuthService.loginWithGoogle();
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg("Connexion Google interrompue ou non configurée sur ce domaine.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg("Veuillez saisir votre adresse email pour recevoir le lien de réinitialisation.");
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.sendResetEmail(email);
      setSuccessMsg("Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMsg("Impossible d'envoyer l'email. Vérifiez l'adresse saisie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#fffdf8] flex flex-col justify-center items-center px-4 py-8 sm:px-6 relative selection:bg-[#d4af37]/30 selection:text-[#f1d477]">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-[#d4af37]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-[#111111] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <p className="text-xs text-gray-400 mt-2">
            Système de Caisse Enregistreuse & Gestion de Stocks
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-[#292929] text-[11px] text-[#d4af37]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Base Firebase Connectée : <strong className="text-white">mrsbstock</strong></span>
          </div>
        </div>

        {/* Tab Switcher: Connexion / Créer un compte */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#181818] p-1 rounded-xl border border-[#282828] mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login' 
                  ? 'bg-[#d4af37] text-black shadow' 
                  : 'text-gray-400 hover:text-white'
              }`}
              id="tabLogin"
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'register' 
                  ? 'bg-[#d4af37] text-black shadow' 
                  : 'text-gray-400 hover:text-white'
              }`}
              id="tabRegister"
            >
              Nouveau Compte
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Mode: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@mrsb.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#171717] border border-[#2c2c2c] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                  id="loginEmailInput"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-300">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                  className="text-[11px] text-[#d4af37] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#171717] border border-[#2c2c2c] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                  id="loginPasswordInput"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#e2bd46] text-black font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              id="submitLoginBtn"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Se connecter à la Caisse</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Nom complet & Prénom
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Ex: Amina Diallo"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#171717] border border-[#2c2c2c] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                  id="registerNameInput"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="amina@mrsb.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#171717] border border-[#2c2c2c] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                  id="registerEmailInput"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Mot de passe (6 caractères min.)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#171717] border border-[#2c2c2c] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                  id="registerPasswordInput"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Rôle attribué
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('caisse')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    role === 'caisse'
                      ? 'bg-blue-950/40 border-blue-500/80 text-blue-300'
                      : 'bg-[#181818] border-[#2c2c2c] text-gray-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Vendeur / Caisse</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    role === 'admin'
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                      : 'bg-[#181818] border-[#2c2c2c] text-gray-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Administrateur</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#e2bd46] text-black font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              id="submitRegisterBtn"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Créer le compte & Accéder</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-4">
              <KeyRound className="w-8 h-8 text-[#d4af37] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white">Réinitialisation du mot de passe</h3>
              <p className="text-xs text-gray-400 mt-1">
                Entrez votre email pour recevoir les instructions de réinitialisation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Votre Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@mrsb.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#171717] border border-[#2c2c2c] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm text-white placeholder-gray-600 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#e2bd46] text-black font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Envoyer l'email
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className="w-full py-2 text-xs text-gray-400 hover:text-white transition text-center block"
            >
              Retour à la connexion
            </button>
          </form>
        )}

        {/* Google Authentication Option */}
        {mode !== 'forgot' && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#262626]"></div>
              </div>
              <span className="relative px-3 bg-[#111111] text-[11px] text-gray-500 uppercase tracking-wider">
                ou continuer avec
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#181818] hover:bg-[#202020] border border-[#2f2f2f] hover:border-[#d4af37]/40 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-3 cursor-pointer"
              id="googleSignInBtn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Connexion avec Google</span>
            </button>

          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-gray-500 max-w-sm">
        <p>Boutique Mrs B — Authentification Firebase Sécurisée</p>
      </div>
    </div>
  );
};
