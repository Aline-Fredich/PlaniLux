import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Download, 
  Upload, 
  ShieldCheck, 
  Check, 
  LogOut 
} from 'lucide-react';
import { UserAccount } from '../types';
import { getCurrentUser, updateCurrentUser, logoutUser } from '../services/authService';
import { exportAllDataAsJSON, importDataFromJSON } from '../services/storageService';
import { downloadFile } from '../services/exportService';

interface AccountModalProps {
  onClose: () => void;
  onDataReloaded: () => void;
  onLogout?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose, onDataReloaded, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(getCurrentUser());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Formulaire d'édition de profil
  const [form, setForm] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    locale: currentUser?.locale || 'fr-FR',
    timezone: currentUser?.timezone || 'Europe/Paris'
  });

  useEffect(() => {
    const u = getCurrentUser();
    setCurrentUser(u);
    if (u) {
      setForm({
        username: u.username,
        email: u.email,
        phone: u.phone,
        address: u.address,
        locale: u.locale || 'fr-FR',
        timezone: u.timezone || 'Europe/Paris'
      });
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateCurrentUser({
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      locale: form.locale,
      timezone: form.timezone
    });

    if (updated) {
      setCurrentUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      onDataReloaded();
    }
  };

  const handleExportBackup = () => {
    const json = exportAllDataAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `planilux_${currentUser?.username || 'sauvegarde'}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(blob, filename);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = await importDataFromJSON(content);
        if (ok) {
          alert('Données et plannings restaurés avec succès !');
          onDataReloaded();
          onClose();
        } else {
          alert('Le fichier sélectionné n’est pas une sauvegarde Planilux valide.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLogoutClick = () => {
    if (confirm('Voulez-vous vraiment vous déconnecter de cette session ?')) {
      logoutUser();
      onClose();
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
      <div className="modal-card" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={20} color="var(--primary)" />
            <h2 id="account-modal-title" className="modal-title">Mon Compte Personnel</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Fermer la modale">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="modal-body">
            {/* Nom & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-username" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={13} color="var(--primary)" />
                  Nom d'utilisateur
                </label>
                <input
                  id="profile-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-email" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={13} color="var(--primary)" />
                  Adresse e-mail
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Téléphone & Adresse */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-phone" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={13} color="var(--primary)" />
                  Numéro de téléphone
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-address" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} color="var(--primary)" />
                  Adresse postale / Ville
                </label>
                <input
                  id="profile-address"
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                  style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Langue & Fuseau */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-locale">
                  <Globe size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Langue
                </label>
                <select
                  id="profile-locale"
                  value={form.locale}
                  onChange={(e) => setForm({ ...form, locale: e.target.value })}
                  style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}
                >
                  <option value="fr-FR">Français (FR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                  <option value="de-DE">Deutsch</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-timezone">
                  <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Fuseau horaire
                </label>
                <select
                  id="profile-timezone"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}
                >
                  <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Montreal">America/Montreal</option>
                  <option value="Africa/Casablanca">Africa/Casablanca</option>
                </select>
              </div>
            </div>

            {/* Sauvegarde & Portabilité */}
            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--primary)" />
                Espace privé & Sauvegarde
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.7rem' }}>
                Vos tableaux sont stockés exclusivement dans votre espace personnel.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-glass-secondary" onClick={handleExportBackup}>
                  <Download size={14} />
                  <span>Exporter la sauvegarde (JSON)</span>
                </button>

                <label className="btn-glass-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={14} />
                  <span>Importer un fichier</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {savedSuccess && (
              <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <Check size={16} />
                <span>Informations de compte mises à jour avec succès !</span>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleLogoutClick}
              style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={15} />
              <span>Se déconnecter</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Fermer
              </button>
              <button type="submit" className="btn-glass-black">
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
