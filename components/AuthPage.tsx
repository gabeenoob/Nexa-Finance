
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          },
        });
        if (error) throw error;
        setSuccessMessage('Cadastro realizado! Verifique seu email.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
      } else if (err.message.includes('User already registered')) {
        setError('Este email já está cadastrado.');
      } else {
        setError(err.message || 'Ocorreu um erro.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0"></div>
      
      {/* Abstract Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      <div className="absolute top-[20%] right-[20%] w-[20vw] h-[20vw] bg-emerald-500/10 rounded-full blur-[80px]"></div>

      {/* Main Card - Glassmorphism */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 md:p-10 relative overflow-hidden group">
          
          {/* Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          <div className="relative z-20">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-white tracking-tight mb-2 drop-shadow-lg">
                Nexa Finance
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                {isSignUp ? 'Crie sua conta para começar' : 'Gestão financeira inteligente'}
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-200">
                <CheckCircle className="shrink-0 mt-0.5" size={18} />
                <span className="text-sm font-bold">{successMessage}</span>
              </div>
            )}

            {error && (
               <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-200">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {isSignUp && (
                <div className="group relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-black/40 text-white placeholder-slate-500 transition-all font-medium"
                    placeholder="Nome Completo"
                  />
                </div>
              )}

              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-black/40 text-white placeholder-slate-500 transition-all font-medium"
                  placeholder="Email"
                />
              </div>

              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-black/40 text-white placeholder-slate-500 transition-all font-medium"
                  placeholder="Senha"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    {isSignUp ? 'Cadastrar' : 'Entrar na Plataforma'} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4 opacity-50">
              <div className="h-px bg-white/20 flex-1"></div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">Ou</span>
              <div className="h-px bg-white/20 flex-1"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-3 backdrop-blur-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </button>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
                <span className="font-bold underline decoration-blue-500 decoration-2 underline-offset-4">
                  {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer Text */}
        <p className="text-center text-slate-500 text-xs mt-8 opacity-60">
          © {new Date().getFullYear()} Nexa Finance. Secure & Encrypted.
        </p>
      </div>
    </div>
  );
}
