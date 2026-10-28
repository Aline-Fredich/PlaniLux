import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { PlaniluxLogo } from './ui/PlaniluxLogo';
import { registerUserAsync, loginUserAsync } from '../services/authService';
import { UserAccount } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: UserAccount) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Formulaire d'inscription (5 champs demandés)
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  // Formulaire de connexion
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await registerUserAsync({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        address: registerForm.address
      });

      if (!result.success || !result.user) {
        setErrorMessage(result.error || "Une erreur est survenue lors de l'inscription.");
        setIsLoading(false);
        return;
      }

      // Connexion automatique après enregistrement
      onAuthSuccess(result.user);
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur technique lors de l'enregistrement.");
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginUserAsync(loginForm.identifier, loginForm.password);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || "Identifiants invalides.");
        setIsLoading(false);
        return;
      }

      onAuthSuccess(result.user);
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur technique lors de la connexion.");
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse at 20% 20%, rgba(37, 99, 235, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Carte Glassmorphism d'authentification */}
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-glass-card)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-glass-elevated)',
          padding: '2.25rem 2rem',
          position: 'relative',
          zIndex: 10,
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* En-tête avec Logo Officiel Planilux */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <PlaniluxLogo size={76} showText={false} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
            Plani<span style={{ color: '#0284c7' }}>Lux</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {mode === 'register' 
              ? 'Créez votre espace personnel sécurisé' 
              : 'Accédez à vos emplois du temps personnels'}
          </p>
        </div>

        {/* Sélecteur d'onglets Inscription / Connexion */}
        <div 
          style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            marginBottom: '1.5rem',
            border: '1px solid var(--glass-border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'register' ? 'var(--primary)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Créer un compte
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '10px',
              border: 'none',
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Se connecter
          </button>
        </div>

        {/* Alerte Erreur */}
        {errorMessage && (
          <div 
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORMULAIRE 1 : INSCRIPTION (5 CHAMPS OBLIGATOIRES) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Nom / Username */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} color="var(--primary)" />
                Nom & Prénom / Nom d'utilisateur
              </label>
              <input
                type="text"
                placeholder="Ex : Sarah Martin"
                required
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={13} color="var(--primary)" />
                Adresse e-mail
              </label>
              <input
                type="email"
                placeholder="nom@exemple.com"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} color="var(--primary)" />
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 4 caractères"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Téléphone & Adresse en 2 colonnes ou groupés */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={13} color="var(--primary)" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  required
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} color="var(--primary)" />
                  Adresse / Ville
                </label>
                <input
                  type="text"
                  placeholder="Paris, France"
                  required
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-glass-black"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.95rem',
                marginTop: '0.5rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <span>{isLoading ? 'Création du compte...' : 'Créer mon compte et démarrer'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* FORMULAIRE 2 : CONNEXION */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={13} color="var(--primary)" />
                Adresse e-mail ou Nom d'utilisateur
              </label>
              <input
                type="text"
                placeholder="nom@exemple.com ou username"
                required
                value={loginForm.identifier}
                onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} color="var(--primary)" />
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-glass-black"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.95rem',
                marginTop: '0.5rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Note de confidentialité & isolation garantie */}
        <div 
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--glass-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>Espace personnel privé et strictement cloisonné</span>
        </div>
      </div>
    </div>
  );
};
