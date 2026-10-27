import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ShieldAlert, Link as LinkIcon, Lock } from 'lucide-react';
import { Board, BoardShare } from '../types';
import { getBoardShares, createBoardShare, revokeBoardShare } from '../services/storageService';

interface ShareModalProps {
  board: Board;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ board, onClose }) => {
  const [shares, setShares] = useState<BoardShare[]>([]);
  const [allowExport, setAllowExport] = useState(true);
  const [expirationDays, setExpirationDays] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadShares = () => {
    const list = getBoardShares(board.id);
    setShares(list);
  };

  useEffect(() => {
    loadShares();
  }, [board.id]);

  const handleCreateShare = () => {
    createBoardShare(board.id, allowExport, expirationDays);
    loadShares();
  };

  const handleRevoke = (shareId: string) => {
    if (confirm('Voulez-vous vraiment révoquer ce lien de partage ? Les personnes disposant de ce lien ne pourront plus accéder au tableau.')) {
      revokeBoardShare(shareId);
      loadShares();
    }
  };

  const handleCopyLink = (share: BoardShare) => {
    const fullUrl = `${window.location.origin}/?share=${share.share_token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <LinkIcon size={20} color="var(--primary)" />
            <h2 id="share-modal-title" className="modal-title">Partager « {board.title} »</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Fermer la modale">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Générez un lien de consultation sécurisé en <strong>lecture seule</strong>. Vous pouvez révoquer l'accès à tout moment.
          </p>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="allow-export-checkbox" style={{ fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Autoriser les visiteurs à exporter (PDF/Word)
              </label>
              <input
                id="allow-export-checkbox"
                type="checkbox"
                checked={allowExport}
                onChange={(e) => setAllowExport(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="expiration-select" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                Durée de validité du lien
              </label>
              <select
                id="expiration-select"
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                style={{ padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
              >
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>3 mois</option>
                <option value={0}>Permanent (jusqu'à révocation)</option>
              </select>
            </div>

            <button type="button" className="btn-glass-black" onClick={handleCreateShare} style={{ marginTop: '0.5rem' }}>
              <Lock size={16} />
              <span>Créer un nouveau lien sécurisé</span>
            </button>
          </div>

          {/* Liste des liens actifs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Liens de partage configurés</h3>
            {shares.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Aucun lien de partage créé pour le moment.
              </p>
            ) : (
              shares.map((s) => {
                const isRevoked = !!s.revoked_at;
                const isExpired = s.expires_at ? new Date(s.expires_at) < new Date() : false;
                const shareUrl = `${window.location.origin}/?share=${s.share_token}`;

                return (
                  <div
                    key={s.id}
                    style={{
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      background: isRevoked || isExpired ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      opacity: isRevoked || isExpired ? 0.7 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isRevoked ? 'var(--danger)' : isExpired ? 'var(--warning)' : 'var(--success)' }}>
                        {isRevoked ? '● Révoqué' : isExpired ? '● Expiré' : '● Actif (Lecture seule)'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Créé le {new Date(s.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {!isRevoked && !isExpired && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          style={{
                            flex: 1,
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.8rem',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-primary)'
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleCopyLink(s)}
                          title="Copier le lien"
                        >
                          {copiedId === s.id ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                          <span style={{ fontSize: '0.8rem' }}>{copiedId === s.id ? 'Copié !' : 'Copier'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-icon"
                          onClick={() => handleRevoke(s.id)}
                          title="Révoquer ce lien"
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
