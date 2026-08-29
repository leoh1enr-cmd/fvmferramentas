import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Wrench,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { setUserAuthenticated, verifyAppPassword } from '../utils/auth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus password input on mount
    inputRef.current?.focus();
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!password.trim()) {
      setError('Por favor, digite a senha de acesso.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate swift verification
    setTimeout(() => {
      const isValid = verifyAppPassword(password);

      if (isValid) {
        setSuccess(true);
        setUserAuthenticated(true, rememberMe);
        setTimeout(() => {
          onLoginSuccess();
        }, 400);
      } else {
        setIsLoading(false);
        setError('Senha incorreta. Verifique e tente novamente.');
        triggerShake();
        setPassword('');
        inputRef.current?.focus();
      }
    }, 250);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-2xl pointer-events-none" />

      {/* Main Login Card */}
      <div 
        className={`w-full max-w-md relative z-10 glass-panel p-8 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-2xl transition-transform duration-300 ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Company Branding */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/30 mb-2">
            <Wrench className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                FVM Ferramentas
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                PRO
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-300/90 mt-0.5">
              Floresta Verde Madeiras
            </p>
          </div>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sistema de Gestão de Ferramentas, Locações, Contratos e Notificações Push
          </p>
        </div>

        {/* Lock Screen Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="app-password-input" 
                className="text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Senha de Acesso</span>
              </label>
            </div>

            <div className="relative">
              <input
                id="app-password-input"
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite a senha de acesso..."
                className={`w-full pl-4 pr-11 py-3.5 glass-input rounded-2xl text-sm font-semibold tracking-wider text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 transition-all ${
                  error ? 'border-rose-500/80 bg-rose-500/10' : ''
                }`}
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Remember me option */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-950"
              />
              <span>Manter conectado neste dispositivo</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || success}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 ${
              success
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Verificando...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>Acesso Liberado!</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ambiente Protegido</span>
          </div>

          <span className="text-slate-400">
            FVM v2.0
          </span>
        </div>
      </div>
    </div>
  );
};
