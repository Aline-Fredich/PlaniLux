import React, { useState, useEffect, useRef } from 'react';
import { Board, TemplateType, UserAccount } from './types';
import {
  getStoredBoards,
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

  // Chargement des tableaux cloisonnés pour l'utilisateur connecté avec synchronisation Cloud
  const refreshBoards = async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) {
      setBoards([]);
      return;
    }
    const localList = getStoredBoards(true, uid);
    setBoards(localList);

    try {
      const cloudList = await syncBoardsFromCloud(uid);
      if (cloudList && cloudList.length > 0) {
        setBoards(cloudList);
      }
    } catch (e) {
      console.warn('Sync cloud Supabase:', e);
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

  // Mise à jour avec sauvegarde automatique temporisée
  const handleUpdateActiveBoard = (updated: Board) => {
    setSaveStatus('saving');
    setBoards(prev => prev.map(b => (b.id === updated.id ? updated : b)));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (currentUser) {
          saveBoard(updated, currentUser.id);
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error', err);
        setSaveStatus('error');
      }
    }, 400);
  };

  // Création à partir d'un modèle pour l'utilisateur connecté
  const handleCreateFromTemplate = (type: TemplateType) => {
    if (!currentUser) return;
    const newBoard = createBoardFromTemplate(type, currentUser.id);
    refreshBoards(currentUser.id);
    setActiveBoardId(newBoard.id);
  };

  // Duplication
  const handleDuplicate = (boardId: string) => {
    if (!currentUser) return;
    const copy = duplicateBoard(boardId, currentUser.id);
    if (copy) {
      refreshBoards(currentUser.id);
      setActiveBoardId(copy.id);
    }
  };

  // Suppression douce (corbeille)
  const handleDelete = (boardId: string) => {
    if (!currentUser) return;
    softDeleteBoard(boardId, currentUser.id);
    refreshBoards(currentUser.id);
    if (activeBoardId === boardId) {
      setActiveBoardId(null);
    }
  };

  // Restauration
  const handleRestore = (boardId: string) => {
    if (!currentUser) return;
    restoreBoard(boardId, currentUser.id);
    refreshBoards(currentUser.id);
  };

  // Suppression définitive
  const handlePermanentDelete = (boardId: string) => {
    if (!currentUser) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce tableau ? Cette action est irréversible.')) {
      permanentlyDeleteBoard(boardId, currentUser.id);
      refreshBoards(currentUser.id);
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
