# Plan Stratégique & Technique d'Amélioration — Planilux

> **Statut :** Proposition & Plan d'Action avant Implémentation  
> **Auteur :** Antigravity Pair Programmer  
> **Projet :** Planilux (Application Web d'Emplois du Temps & Planification)  
> **Date :** 26 Octobre 2026  

---

## 1. Audit Complet du Projet Existant

### 1.1 Architecture & Stack Actuelle
- **Frontend :** React 18 avec TypeScript, Vite, TailwindCSS (pour les utilitaires) et CSS Vanilla personnalisé (`src/styles/index.css`).
- **Composants Principaux :**
  - [`App.tsx`](file:///c:/Users/Dell/Downloads/Emploi_du_temps/src/App.tsx) : Gestion de l'état global, chargement localStorage / Supabase, routage d'écrans.
  - [`Sidebar.tsx`](file:///c:/Users/Dell/Downloads/Emploi_du_temps/src/components/Sidebar.tsx) : Barre latérale avec filtres de catégories, bouton de création rapide, et bloc de pied de page.
  - [`BoardList.tsx`](file:///c:/Users/Dell/Downloads/Emploi_du_temps/src/components/BoardList.tsx) : Tableau de bord avec classeurs interactifs (`GlassFolder`), grille de modèles, corbeille et recherche.
  - [`BoardEditor.tsx`](file:///c:/Users/Dell/Downloads/Emploi_du_temps/src/components/BoardEditor.tsx) : Éditeur matriciel avec gestion dynamique des lignes/colonnes, sélection de cellules et notes de bas de page.
  - [`PrintPreviewModal.tsx`](file:///c:/Users/Dell/Downloads/Emploi_du_temps/src/components/PrintPreviewModal.tsx) : Modale d'aperçu d'impression et d'export (PDF, DOCX, impression navigateur).
  - [`CellPropertiesPanel.tsx`](file:///c:/Users/Dell/Downloads/Emploi_du_temps/src/components/CellPropertiesPanel.tsx) : Personnalisation fine des couleurs de cellule, de police et alignement.

### 1.2 Points Forts Identifiés
1. **Modèle de données relationnel propre** : structure matricielle claire (`axes` et `cells`), découplage axe temporel / jours.
2. **5 modèles de départ fonctionnels** : emploi du temps classique, vue mensuelle, hebdomadaire, quotidienne et libre.
3. **Moteur d'export réel** : génération de PDF vectoriel (via `jspdf` & `jspdf-autotable`) et DOCX natif (via `docx`).

### 1.3 Faiblesses & Opportunités Immédiates
1. **Surabondance de termes techniques intrusifs** : Textes et badges tels que *"3D Glass Design"*, *"Design unifié Glassmorphism & Shaders procéduraux"*, *"Planilux 3D"* polluent la clarté visuelle et créent une impression de prototype plutôt que de produit fini haut de gamme.
2. **Module d'impression limité** :
   - Formats limités à A4 et US Letter, sans prise en compte des formats mobiles (ex: **Fond d'écran verrouillé smartphone 9:16**, **Desktop wallpaper 16:9**).
   - Manque de contrôle sur l'**échelle des cases** (zoom / hauteur des lignes / largeur des colonnes / densité d'affichage).
   - Prévisualisation simplifiée ne reflétant pas fidèlement le rendu graphique final.
3. **Manque d'interactivité tactile & visuelle sur les tableaux** :
   - Les tableaux et menus manquent d'un effet de surélévation dynamique ("effet de flottement/mouvement" avec assombrissement subtil de l'arrière-plan comme sur les classeurs de dossiers).

---

## 2. Benchmark Marché & Veille Concurrentielle (Scraping & Analyse)

Une analyse comparative des applications d'emploi du temps et de planification (Canva Timetable Maker, Adobe Express Schedule, Notion Calendar, TimeTune, EDC Timetable) a permis de dégager les meilleures pratiques mondiales :

| Fonctionnalité / Tendance | Solutions du Marché (Canva, Adobe Express, Notion) | Bénéfice pour Planilux | Priorité |
|---|---|---|---|
| **Export Fond d'Écran (Smartphone & PC)** | Canva propose des templates dédiés 9:16 (écran verrouillé) et 16:9 (bureau PC). | L'utilisateur garde son planning visible toute la journée sans ouvrir l'appli. Taux d'engagement maximal. | **Haute (Demandée)** |
| **Contrôle de Densité / Zoom des Cases** | Possibilité de compacter ou d'agrandir les cases pour adapter le nombre d'heures ou la quantité de texte. | Flexibilité totale selon que l'on a 4 ou 12 cours par jour, sur petit ou grand écran. | **Haute (Demandée)** |
| **Micro-Interactions & Élévation (Float & Depth)** | Interfaces modernes type macOS / iOS avec cartes qui s'élèvent au survol et ombre diffuse d'arrière-plan. | Donne une impression de réactivité, de légèreté et de grand standing professionnel. | **Haute (Demandée)** |
| **Nettoyage Sémantique & Sobriété** | Marques épurées (Notion, Apple) éliminant tout jargon de rendu graphique au profit de la valeur d'usage. | Clarté cognitive immédiate, crédibilité professionnelle renforcée. | **Haute (Demandée)** |
| **Code Couleur Rapide & Catégories** | Palettes harmonisées par matière/type d'activité (Cours, TD, Révision, Sport, Repos). | Lisibilité en un coup d'œil, réduction de la charge mentale. | **Moyenne** |
| **Multi-Pages / Emplois du Temps Semaine A/B** | Gestion de semaines paires / impaires ou alternance. | Idéal pour étudiants et enseignants au rythme bi-hebdomadaire. | **Évolution V2** |

---

## 3. Plan d'Action Détaillé & Spécifications

### Axe 1 : Épuration des Textes & Cohérence Visuelle
- **Suppression intégrale** du badge et texte du footer : *"3D Glass Design"*, *"Design unifié Glassmorphism & Shaders procéduraux"*.
- **Suppression du "3D"** dans la marque : Remplacer `Planilux 3D` par `Planilux`.
- **Nettoyage des mentions secondaires** :
  - `Dossiers 3D` $\rightarrow$ `Dossiers` ou `Classeurs`.
  - `3D Glassmorphism Workspace` $\rightarrow$ `Espace de travail Planilux`.
  - Remplacer les références verbeuses dans les descriptions et boutons d'export.

### Axe 2 : Système de Mouvement & Élévation Interactive (Tables & Menus)
- **Effet de légèreté dynamique sur les tables & cellules :**
  - Au survol (`hover`) ou focus tactile d'une ligne, d'une cellule ou d'un tableau entier : translation vers le haut (`transform: translateY(-4px)` ou `translateY(-2px)` sur cellule), accentuation de la bordure lumineuse et projection d'une ombre douce et profonde (`box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.45)`).
  - Assombrissement d'ambiance en arrière-plan (effet de profondeur cinéma / focus théâtral) lors de l'interaction active.
- **Application aux menus et listes du Dashboard :**
  - Effet de glissement dynamique et surélévation fluide (`transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)`) sur les boutons de navigation de la sidebar et les cartes de tableaux récents.

### Axe 3 : Refonte Complète du Module d'Impression & d'Exportation Multi-Supports
- **Orientations & Formats Disponibles :**
  1. **Papier standard :** A4 (Portrait & Paysage), US Letter (Portrait & Paysage).
  2. **Fond d'Écran Smartphone (9:16) :** Ratio vertical optimisé pour écrans de verrouillage iPhone & Android (1080 × 1920 px ou rendu vectoriel proportionnel), centrage des créneaux horaires évitant l'horloge système du téléphone.
  3. **Fond d'Écran Ordinateur (16:9) :** Ratio horizontal panoramique pour bureau Windows/Mac.
  4. **Format Tablette (3:4 / 4:3) :** Adapté à l'iPad et tablettes Android.
- **Contrôles de Dimensionnement des Cases :**
  - **Sélecteur de Densité :** *Compact* (cases resserrées, idéal pour emplois du temps chargés), *Standard*, *Confortable / Spacieux* (cases hautes avec beaucoup d'espace pour écrire).
  - **Curseur de Zoom / Échelle des Cases (70% à 150%)** : permet d'augmenter ou réduire directement la taille de la grille et des textes pour calibrer parfaitement le document sur une seule page sans débordement.
- **Formats d'Export :**
  - **PDF Haute Définition** (Vectoriel & Imprimable).
  - **Image PNG Haute Résolution (Fond d'écran)** téléchargeable en un clic pour smartphone ou ordinateur.
  - **Document Word (.docx)** éditable.
  - **Impression directe navigateur** (`Ctrl+P` / `window.print`).

---

## 4. Feuille de Route d'Implémentation (Fichiers Impactés)

| Étape | Fichiers Cibles | Actions Prévues |
|---|---|---|
| **Phase 1 : Nettoyage UI** | `Sidebar.tsx`, `BoardList.tsx`, `BoardEditor.tsx`, `index.css` | Retrait des mentions 3D/Shaders/Glassmorphism. Remplacement du branding par Planilux pur. |
| **Phase 2 : Système de Mouvement** | `index.css`, `BoardEditor.tsx`, `Sidebar.tsx`, `BoardList.tsx` | Ajout des classes CSS d'élévation, de transitions `cubic-bezier`, d'ombres portées profondes et de voile sombre d'arrière-plan. |
| **Phase 3 : Moteur d'Export & Impression** | `types/index.ts`, `PrintPreviewModal.tsx`, `exportService.ts` | Ajout des ratios Fond d'écran (Phone 9:16, Desktop 16:9), contrôles de taille des cases (zoom/densité), export PNG haute résolution et PDF adapté. |
| **Phase 4 : Validation & Tests** | Navigateur / Vite dev server | Vérification responsive sur mobile, tablette et desktop, test d'export PDF/PNG/DOCX. |

---

## 5. Vos Avis et Validation

Ce plan répond point par point à vos attentes exprimées dans votre note vocale.  
**Dès votre feu vert, nous lançons l'implémentation complète sans délai.**
