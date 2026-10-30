import React, { useState, useEffect, useRef } from 'react';
import { Board, TemplateType, UserAccount } from './types';
import {
  saveBoard,
  duplicateBoard,
  softDeleteBoard,
  restoreBoard,
  permanentlyDeleteBoard,
  createBoardFromTemplate,
  syncBoardsFromCloud,
  SaveStatus
} from './services/storageService';
import { getCurrentUser, logoutUser } from './services/authService';
import { AuthPage } from './components/AuthPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BoardList } from './components/BoardList';
import { BoardEditor } from './components/BoardEditor';
import { AccountModal } from './components/AccountModal';

export const App: React.FC = () => {
  // Session utilisateur
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());

  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('planilux_theme') as 'light' | 'dark') || 'light';
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Détection écran mobile pour fermer la sidebar par défaut sur mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Appliquer le thème sur l'élément racine
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('planilux_theme', theme);
  }, [theme]);

  // Chargement des tableaux cloisonnés pour l'utilisateur connecté directement depuis Supabase
  const refreshBoards = async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) {
      setBoards([]);
      return;
    }

    try {
      setSaveStatus('saving');
      const cloudList = await syncBoardsFromCloud(uid, true);
      setBoards(cloudList);
      setSaveStatus('saved');
    } catch (e) {
      console.warn('Erreur chargement Supabase:', e);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshBoards(currentUser.id);
    } else {
      setBoards([]);
    }
  }, [currentUser]);

  // Détection d'un paramètre URL de partage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (shareToken && boards.length > 0) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards]);

  // Bascule Dark / Light
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Déconnexion
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setBoards([]);
    setActiveBoardId(null);
  };

  // Tableau actif
  const activeBoard = boards.find(b => b.id === activeBoardId) || null;

  // Calcul des compteurs pour la Sidebar
  const counts = {
    total: boards.filter(b => !b.deleted_at).length,
    timetable: boards.filter(b => !b.deleted_at && b.template_type === 'timetable').length,
    planner: boards.filter(b => !b.deleted_at && ['monthly', 'weekly', 'daily'].includes(b.template_type)).length,
    free: boards.filter(b => !b.deleted_at && b.template_type === 'free').length,
    trash: boards.filter(b => !!b.deleted_at).length
  };

  // Mise à jour avec persistance confirmée sur Supabase
  const handleUpdateActiveBoard = (updated: Board) => {
    setSaveStatus('saving');
    setBoards(prev => prev.map(b => (b.id === updated.id ? updated : b)));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (currentUser) {
          await saveBoard(updated, currentUser.id);
          setSaveStatus('saved');
        }
      } catch (err) {
        console.error('Erreur confirmation Supabase:', err);
        setSaveStatus('error');
      }
    }, 400);
  };

  // Création à partir d'un modèle directement sur Supabase
  const handleCreateFromTemplate = async (type: TemplateType) => {
    if (!currentUser) return;
    try {
      setSaveStatus('saving');
      const newBoard = await createBoardFromTemplate(type, currentUser.id);
      await refreshBoards(currentUser.id);
      setActiveBoardId(newBoard.id);
      setSaveStatus('saved');
    } catch (e) {
      console.error('Erreur création modèle Supabase:', e);
      setSaveStatus('error');
    }
  };

  // Duplication sur Supabase
  const handleDuplicate = async (boardId: string) => {
    if (!currentUser) return;
    try {
      setSaveStatus('saving');
      const copy = await duplicateBoard(boardId, currentUser.id);
      if (copy) {
        await refreshBoards(currentUser.id);
        setActiveBoardId(copy.id);
        setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Erreur duplication Supabase:', e);
      setSaveStatus('error');
    }
  };

  // Suppression douce sur Supabase (corbeille)
  const handleDelete = async (boardId: string) => {
    if (!currentUser) return;
    try {
      setSaveStatus('saving');
      await softDeleteBoard(boardId, currentUser.id);
      await refreshBoards(currentUser.id);
      if (activeBoardId === boardId) {
        setActiveBoardId(null);
      }
      setSaveStatus('saved');
    } catch (e) {
      console.error('Erreur corbeille Supabase:', e);
      setSaveStatus('error');
    }
  };

  // Restauration depuis la corbeille sur Supabase
  const handleRestore = async (boardId: string) => {
    if (!currentUser) return;
    try {
      setSaveStatus('saving');
      await restoreBoard(boardId, currentUser.id);
      await refreshBoards(currentUser.id);
      setSaveStatus('saved');
    } catch (e) {
      console.error('Erreur restauration Supabase:', e);
      setSaveStatus('error');
    }
  };

  // Suppression définitive sur Supabase
  const handlePermanentDelete = async (boardId: string) => {
    if (!currentUser) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce tableau de Supabase ? Cette action est irréversible.')) {
      try {
        setSaveStatus('saving');
        await permanentlyDeleteBoard(boardId, currentUser.id);
        await refreshBoards(currentUser.id);
        setSaveStatus('saved');
      } catch (e) {
        console.error('Erreur suppression définitive Supabase:', e);
        setSaveStatus('error');
      }
    }
  };

  // Si aucun utilisateur n'est connecté, afficher la page de connexion / inscription
  if (!currentUser) {
    return (
      <AuthPage 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          refreshBoards(user.id);
        }} 
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Barre Latérale Navigation Glassmorphism */}
      <Sidebar
        activeView={activeBoardId ? 'editor' : 'list'}
        activeCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (activeBoardId) setActiveBoardId(null);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onCreateFromTemplate={handleCreateFromTemplate}
        currentUser={currentUser}
        onLogout={handleLogout}
        counts={counts}
      />

      {/* Conteneur Principal avec En-tête et Vues */}
      <div className={`main-wrapper ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header
          currentView={activeBoardId ? 'editor' : 'list'}
          onNavigateHome={() => setActiveBoardId(null)}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          saveStatus={saveStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main style={{ flex: 1 }}>
          {activeBoard ? (
            <BoardEditor
              board={activeBoard}
              onUpdateBoard={handleUpdateActiveBoard}
              onBack={() => setActiveBoardId(null)}
            />
          ) : (
            <BoardList
              boards={boards}
              selectedCategory={selectedCategory}
              onSelectBoard={(id) => setActiveBoardId(id)}
              onCreateFromTemplate={handleCreateFromTemplate}
              onDuplicateBoard={handleDuplicate}
              onDeleteBoard={handleDelete}
              onRestoreBoard={handleRestore}
              onPermanentDeleteBoard={handlePermanentDelete}
            />
          )}
        </main>
      </div>

      {isAccountModalOpen && (
        <AccountModal
          onClose={() => setIsAccountModalOpen(false)}
          onDataReloaded={() => refreshBoards(currentUser.id)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
