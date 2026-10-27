import React, { useState, useEffect } from 'react';
import { X, User, Globe, Clock, Download, Upload, ShieldCheck, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { getStoredProfile, saveProfile, exportAllDataAsJSON, importDataFromJSON } from '../services/storageService';
import { downloadFile } from '../services/exportService';

interface AccountModalProps {
  onClose: () => void;
  onDataReloaded: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose, onDataReloaded }) => {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProfile(getStoredProfile());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    const json = exportAllDataAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `planilux_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(blob, filename);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataFromJSON(content);
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

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={20} color="var(--primary)" />
            <h2 id="account-modal-title" className="modal-title">Mon Profil & Préférences</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Fermer la modale">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Nom complet ou pseudonyme</label>
              <input
                id="profile-name"
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                required
                style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-locale">
                  <Globe size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Langue
                </label>
                <select
                  id="profile-locale"
                  value={profile.locale}
                  onChange={(e) => setProfile({ ...profile, locale: e.target.value })}
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
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Fuseau horaire
                </label>
                <select
                  id="profile-timezone"
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
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
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--primary)" />
                Portabilité & Sauvegarde des données
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                Vos tableaux sont stockés en toute confidentialité sur votre navigateur. Exportez ou importez vos données en un clic.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-glass-secondary" onClick={handleExportBackup}>
                  <Download size={15} />
                  <span>Exporter la sauvegarde (JSON)</span>
                </button>

                <label className="btn-glass-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={15} />
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
                <span>Modifications enregistrées !</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-glass-black">
              Enregistrer les préférences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
