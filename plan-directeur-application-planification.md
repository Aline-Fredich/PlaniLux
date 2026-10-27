# Plan directeur — application de création d’emplois du temps et de planification

> Plan produit et technique pour une application web responsive inspirée des cinq captures EasyTable fournies. Il décrit ce qui est à construire; aucun logiciel n’est codé dans ce document.

## 1. Vision et synthèse

Créer un service gratuit pour étudiants, professionnels et personnes qui souhaitent organiser leur temps. Il permet de créer des emplois du temps et des planificateurs personnalisés, de les modifier simplement sur téléphone ou ordinateur, de dupliquer ou partager un tableau, puis d’obtenir des fichiers PDF et DOCX conçus pour l’impression.

Le produit reprend cinq catégories visibles dans les captures : emploi du temps, planificateur mensuel, hebdomadaire, quotidien et tableau libre. Le tableau appartient à l’utilisateur par défaut. Les exports, le partage et les réglages d’impression font partie du parcours principal.

**Socle recommandé :** Next.js, React et TypeScript; Supabase pour PostgreSQL, Auth, Storage et fonctions serveur ciblées; Bitbucket pour le dépôt et les pipelines; Vercel pour les déploiements. Commencer par une application modulaire unique, sans microservices prématurés.

## 2. Analyse des cinq captures fournies

Les fichiers joints ont été ouverts et examinés. Les observations ci-dessous décrivent ce qui est visible; les fonctions non illustrées sont des recommandations de conception.

| Capture | Ce qui est visible | Implication produit |
|---|---|---|
| Accueil avec création | En-tête EasyTable, menu, accueil personnalisé, bouton de mise à niveau, liste et cinq cartes de création : emploi du temps, planificateur mensuel, hebdomadaire, quotidien et tableau vide. | Accueil orienté vers la création et les tableaux récents; modèles accessibles en un geste. |
| Liste de tableaux | Cartes verticales avec icône, nom, type, date, action de copie et bouton flottant +. Une icône étincelle est également présente mais sa fonction n’est pas explicitée. | Liste compacte, duplication au niveau de la carte, création toujours disponible. |
| Menu latéral | Partage de l’application, évaluation, commentaire, réseaux sociaux, publicité, autres applications, numéro de version. | Aide, retour utilisateur et informations produit peuvent être secondaires; publicité et promotion ne sont pas nécessaires au MVP. |
| Grille d’emploi du temps | Colonne des heures, colonnes des jours, cases colorées et blanches, activités répétées plusieurs jours, heures traversant minuit, bouton +. | Grille modifiable, horaires personnalisés, couleur par cellule ou activité, répétition/copie, support des créneaux de nuit. |
| Menu du tableau | Partager, redimensionner la table, changer la mise en page, aligner le texte, renommer et supprimer. | Ces commandes doivent être présentes, regroupées, accessibles et accompagnées d’une confirmation pour les suppressions. |

Les captures montrent une interface mobile francophone et une grille denses. Elles ne montrent pas précisément les écrans d’export, de partage en ligne, l’authentification ou les autres modèles. Les options recommandées dans ce plan couvrent ces besoins sans les attribuer à l’application observée. Créer une identité graphique, un nom, une palette et des icônes propres; reprendre les parcours et non les éléments de marque.

## 3. Public et périmètre produit

### Utilisateurs

- Étudiants : cours, révisions, examens, devoirs, stages et habitudes.
- Professionnels indépendants : tâches, rendez-vous, périodes de travail et objectifs.
- Grand public : organisation quotidienne, routines, repas et projets personnels.

### Gratuité

Le cœur d’usage demeure gratuit : compte, tableaux, modèles de base, cellules et couleurs, sauvegarde, duplication, partage en lecture seule, export PDF et DOCX sans filigrane. Ne pas rendre l’application inutilisable par des limites basses. Si des quotas sont nécessaires pour maîtriser le coût, les afficher avant l’action et ne jamais supprimer les données de l’utilisateur. Une offre facultative ultérieure peut financer stockage accru, historique long ou fonctions collaboratives avancées; elle n’est pas requise au lancement.

### MVP inclus

- Authentification, récupération de compte, profil, préférences de langue et fuseau.
- Tableau de bord, recherche, tri et filtre par type.
- Cinq modèles initiaux personnalisables.
- Édition des cellules : contenu, fond, texte, alignement et style.
- Ajout/suppression/redimensionnement des lignes et colonnes.
- Sauvegarde automatique avec état visible, reprise et gestion des erreurs.
- Renommage, duplication, suppression logique et restauration courte.
- Lien de partage lecture seule, révocable et facultativement expirant.
- Aperçu et export PDF/DOCX avec paramètres d’impression.

Hors MVP : synchronisation Google/Outlook, notifications complexes, collaboration simultanée, application native, paiement, import OCR et génération IA.

## 4. Modèles et fonctions

### Emploi du temps

Grille par jour et plage horaire; nombre de jours, début de journée, durée de créneau et premier jour de semaine configurables. Une entrée contient un titre, des détails facultatifs, lieu, couleur, étiquette et éventuellement état. Une activité peut couvrir plusieurs créneaux ou être répétée/copier-collée. La plage peut traverser minuit. Les pauses doivent être distinguables des cases vides.

### Planificateur mensuel

Vue calendrier de quatre à six semaines, mois/année navigables, choix du début de semaine, plusieurs éléments par jour, compteur des éléments masqués. L’export propose une page si lisible ou plusieurs pages si nécessaire.

### Planificateur hebdomadaire et quotidien

Vue hebdomadaire en grille horaire ou tâches par jour. Vue quotidienne avec date, priorités, créneaux, tâches et notes. Les tâches ont un statut explicite à faire/en cours/terminé; le statut ne dépend pas uniquement de la couleur.

### Tableau libre

Grille configurable, intitulés modifiables, quadrillage masquable, lignes et colonnes insérables, supprimables et redimensionnables. La fusion de cellules est à différer tant que son rendu DOCX et PDF n’est pas stable.

### Édition et actions

L’édition ouvre un panneau adapté au tactile : texte, couleur, style, alignement et effacement de mise en forme. Palette de couleurs avec valeurs recommandées et couleurs personnalisées; signaler un contraste insuffisant. Annuler/rétablir les actions récentes. Le glisser-déposer sur ordinateur reste facultatif; chaque action doit aussi être accessible sans geste précis.

La duplication copie paramètres, axes et contenu dans une transaction, crée un nouvel identifiant et attribue la copie au compte courant. Le partage utilise un jeton imprévisible, lecture seule par défaut, révocable et expirant en option. La suppression est logique au départ; une purge ultérieure applique une politique de rétention.

## 5. UX/UI responsive et accessibilité

### Écrans

1. **Mes tableaux :** accueil personnalisé, création, cartes (nom, type, modification récente, menu), recherche, tri, filtres.
2. **Créer :** cinq modèles avec aperçu, explication et nom facultatif.
3. **Éditeur :** barre supérieure avec retour, nom, état de sauvegarde et menu; grille centrale; outils contextuels et panneau de propriétés.
4. **Aperçu d’impression :** pages visualisées avec paramètres et avertissement de lisibilité/débordement.
5. **Partage :** droit d’accès, expiration, copie et révocation de lien.
6. **Compte :** profil, langue, fuseau horaire, sessions et suppression.

Mobile : grille défilable horizontalement, en-têtes figés lorsque possible, zoom ciblé et commandes tactiles; les outils s’ouvrent dans une feuille basse. Tablette : panneau repliable. Ordinateur : grille complète, panneau persistant, raccourcis clavier. Cibles tactiles d’au moins 44 px, focus visible et états de chargement/erreur/vide définis.

Viser WCAG 2.2 AA : navigation clavier, libellés, contraste, annonces d’état, réduction des animations. Aucun statut n’est indiqué uniquement par une couleur. Localiser les dates et heures; conserver le fuseau et le jour de début de semaine explicitement. Préparer les chaînes pour d’autres langues.

## 6. Architecture recommandée

Client Next.js/React/TypeScript : routes publiques, zone authentifiée, liste et éditeur. Couche métier : règles de modèles, validation, duplication, partage et export. Supabase : Auth, PostgreSQL avec RLS et Storage privé. Vercel : application et fonctions serveur. Les lectures et écritures simples passent par le client Supabase protégé par RLS; les opérations sensibles et multi-tables utilisent une fonction serveur ou RPC transactionnelle.

Garder la grille relationnelle plutôt que d’enregistrer tout le tableau dans un JSON opaque. JSONB convient aux préférences d’affichage versionnées. Le serveur demeure la source de vérité. Les changements utilisent un numéro de version; une version obsolète déclenche un conflit explicite. La sauvegarde est différée brièvement, regroupée par lots, et affiche Enregistré, Enregistrement, Hors ligne ou Échec. Le cache local sert à la résilience, pas de source d’autorité.

### Organisation du dépôt Bitbucket

planner-app/
- apps/web/ — application Next.js : app/, components/, features/boards, templates, sharing, exports; lib/; styles/; public/
- packages/domain/ — types et règles métier indépendants de l’interface
- packages/export/ — représentation canonique, adaptateurs PDF et DOCX
- supabase/migrations/ — migrations SQL versionnées
- supabase/seed.sql — données de développement fictives
- supabase/tests/ — tests SQL et RLS
- tests/ — tests de parcours et régressions de rendu
- docs/ — architecture, décisions (ADR), runbooks
- .bitbucket/pipelines/ — CI/CD
- .env.example, .gitignore, package.json, lockfile, README.md

Pour un MVP, les packages peuvent être intégrés sous apps/web. Protéger main; branches courtes et pull requests. Les migrations sont relues et appliquées d’abord hors production. Ne jamais commettre .env, clés, exports ou données réelles.

## 7. Schéma Supabase détaillé

### Conventions

UUID comme identifiants; timestamptz en UTC; date pour les journées de calendrier; time pour les heures locales avec fuseau sur profil/tableau. Chaque entité modifiable a created_at et updated_at, mis à jour par trigger. RLS sur toutes les tables exposées. Les FK enfants doivent être validées comme appartenant au même tableau. Le secret service_role est réservé au serveur.

### Tables

**profiles** — id UUID PK et FK auth.users(id) avec suppression en cascade; display_name nullable; locale (défaut fr); timezone (nom IANA); created_at, updated_at. L’utilisateur ne lit/modifie que son profil. Création idempotente après inscription.

**boards** — id UUID PK; owner_id FK profiles non nul; title non vide (1–120 caractères); template_type enum timetable/monthly/weekly/daily/free; settings JSONB objet validé côté serveur; timezone; week_starts_on entier 0–6; version entier >=1; created_at, updated_at; deleted_at nullable. Index partiel (owner_id, updated_at desc) et (owner_id, template_type) pour tableaux non supprimés. Le client ne peut pas changer owner_id librement.

**board_axes** — id UUID PK; board_id FK boards avec cascade; axis row/column; position entier >=0; label; kind time_slot/weekday/date/custom; start_time et end_time facultatifs; date_value facultatif; size_px borné; metadata JSONB. Unique (board_id, axis, position); index sur ces colonnes. Un créneau traversant minuit est valide : ne pas imposer end_time supérieur à start_time; conserver l’offset de jour si nécessaire.

**board_cells** — id UUID PK; board_id FK; row_axis_id et column_axis_id FK; content texte borné; background_color et text_color hex validés; text_style JSONB; position_order >=0; timestamps. Pour une seule entrée par intersection, unique (board_id, row_axis_id, column_axis_id). Index sur tableau, ligne et colonne. Une contrainte composite ou fonction vérifie que les deux axes appartiennent au tableau indiqué.

**cell_items** — recommandée si une case contient plusieurs tâches/événements : id, board_id, row_axis_id, column_axis_id, title, details, starts_at, ends_at, status (todo/in_progress/done), background_color, position >=0, timestamps. Contrôle d’appartenance des axes; index (board_id,row_axis_id,column_axis_id,position) et (board_id,starts_at) si recherche par date.

**board_members** — board_id FK, user_id FK profiles, role viewer/editor, invited_by FK, created_at; PK (board_id,user_id), index (user_id,board_id). Le propriétaire reste dans boards.owner_id et ne peut pas être retiré comme membre.

**board_shares** — id UUID PK, board_id FK cascade, token_hash unique, created_by FK, permission limitée à view au MVP, expires_at, revoked_at, allow_export booléen, created_at. Stocker le hash seulement, jamais le jeton brut. Endpoint serveur valide expiration/révocation et renvoie une vue limitée.

**export_jobs** — id, board_id FK, requested_by FK, format pdf/docx, status queued/processing/ready/failed/expired, options JSONB, storage_path, error_code, expires_at, timestamps. Index (requested_by,created_at desc) et (status,created_at). Aucune trace interne dans l’erreur renvoyée au client.

**audit_events** — journal limité des actions sensibles : actor_id, board_id, event_type, target_id, métadonnées filtrées, created_at. Pas de contenu de cellule; accès interdit aux utilisateurs ordinaires; rétention documentée.

Relations : auth.users 1:1 profiles; profiles 1:n boards; boards 1:n board_axes, board_cells/cell_items, board_members, board_shares et export_jobs; profiles 1:n board_members.

### Rôles et RLS

- anon : pas d’accès direct aux tables privées; aperçu partagé via endpoint contrôlé seulement.
- authenticated : accès conditionné au propriétaire ou au rôle dans board_members.
- service_role : fonctions serveur uniquement, jamais dans le navigateur.
- Pas de rôle administrateur global dans l’application au MVP.

Politiques : profiles limité au propriétaire; boards accessibles au propriétaire et en lecture aux viewers, écriture aux editors; seuls les propriétaires gèrent partage et membres; enfants accessibles uniquement si l’utilisateur a accès au board parent; export visible uniquement à la personne autorisée; audit_events inaccessible directement. Les politiques doivent vérifier la relation réelle avec l’utilisateur, pas seulement l’existence du board_id. Les liens publics sont résolus côté serveur avec jeton hashé. Les fonctions SECURITY DEFINER éventuelles fixent search_path, ont des droits minimaux et valident explicitement l’utilisateur.

Tester les accès négatifs entre comptes A et B, les rôles viewer/editor, anon, un axe appartenant à un autre tableau, et les appels sans session. Indexer les chemins réellement filtrés. Contraintes CHECK pour titre, tailles, positions, statuts, rôles et couleurs; validation métier également côté serveur. Changements de schéma progressifs et migration testée depuis base vierge et version précédente.

## 8. Auth, API et services

Supabase Auth avec e-mail/mot de passe, confirmation d’adresse, récupération, limitation des tentatives, déconnexion et callbacks autorisés par environnement. Profil applicatif distinct de l’identité. OAuth pourra être ajouté si demandé.

Services : BoardService (création, renommage, duplication transactionnelle, soft delete/restauration); GridService (validation et mutations par lot); ShareService (jetons aléatoires, hash, révocation); ExportService (lecture cohérente, rendu, stockage temporaire); ProfileService (préférences et compte).

API indicative :
- POST /api/boards : modèle, nom, options; crée tableau et axes transactionnellement.
- PATCH /api/boards/:id : champs autorisés et version attendue; 409 si conflit.
- POST /api/boards/:id/duplicate : copie profonde et nouvelle propriété.
- POST /api/boards/:id/cells/batch : mutations validées, nouvelle version retournée.
- POST/DELETE /api/boards/:id/shares : crée/révoque le partage.
- POST /api/boards/:id/exports : format, marges, orientation; génère ou met en file.
- GET /api/shared/:token : vue minimale après contrôle du lien.

Valider toute entrée par schéma; limiter taille et fréquence; réponses d’erreur uniformes sans fuite de détails.

## 9. Exports DOCX, PDF et impression

Créer une représentation canonique versionnée : dimensions, ordre des axes, titres, contenu, style, fuseau, langue et options d’impression. PDF et DOCX partagent les données sources.

Prévisualisation : A4 par défaut, Letter en option; portrait/paysage; marges prédéfinies ou personnalisées; ajuster à la largeur/une page/taille réelle; pagination manuelle; répétition des en-têtes et de la colonne horaire; quadrillage, fonds, titre, date, numéros de page, noir et blanc, cases vides. Avertir si l’échelle rend le texte trop petit ou si une case est coupée.

DOCX : tableau Word natif éditable, largeurs explicites, styles et sauts de page. Ne pas rasteriser la grille. Les polices et versions de Word/LibreOffice peuvent modifier la pagination; l’indiquer dans l’aide. PDF : sortie de référence à pagination déterministe, polices incorporées selon licence, contraste et marges imprimables. Impression navigateur reste complémentaire.

Régression PDF pour chaque modèle, contenu long, grille large, couleurs, pages multiples, A4/Letter et orientation. Contrôler visuellement les coupures, en-têtes répétés, lisibilité et marges. Le produit promet un PDF reproductible et un DOCX éditable, pas une identité parfaite de rendu entre tous logiciels.

## 10. Stockage, configuration et déploiement

Bucket Storage privé exports; chemins opaques user/board/export; URL signée courte après contrôle des droits; nettoyage des fichiers expirés; limite de taille et contrôle MIME. PostgreSQL reste la source des tableaux.

Variables indicatives :
- NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY : client; RLS protège l’accès.
- SUPABASE_SERVICE_ROLE_KEY : serveur uniquement.
- APP_URL : URL canonique.
- EXPORT_STORAGE_BUCKET et EXPORT_SIGNED_URL_TTL_SECONDS : export.
- SENTRY_DSN facultatif : erreurs expurgées.

Fournir .env.example sans secret; valeurs réelles configurées dans Bitbucket/Vercel/Supabase, séparées par environnement. Valider les variables au démarrage.

Environnements : local avec Supabase CLI et données fictives; staging avec projet Supabase séparé et domaines de callback propres; production isolée avec secrets, sauvegardes et alertes. Le pipeline Bitbucket sur pull request exécute installation reproductible, lint, types, tests unitaires, tests SQL/RLS, build, parcours essentiels et contrôle de secrets/dépendances. Fusion main déploie staging, applique les migrations puis lance les smoke tests. La production suit une release contrôlée et sauvegardée.

Connecter le dépôt à Vercel; définir les variables Development/Preview/Production, domaine TLS, callbacks Auth restreints et contrôle de taille/durée des fonctions d’export. Si le rendu dépasse les limites serverless, utiliser une file et un worker. Smoke tests post-déploiement : connexion, création, sauvegarde, partage, export et téléchargement.

## 11. Sécurité, confidentialité et fiabilité

- RLS vérifié sur toutes les tables exposées; tests de non-accès inter-comptes.
- Clés privilégiées côté serveur; validation des entrées; contenu de cellule rendu comme texte, jamais HTML exécutable.
- Jetons de partage aléatoires, hashés, expirables, révocables et limités en débit.
- TLS, politique CSP adaptée, en-têtes de sécurité, moindre privilège et suivi des dépendances.
- Ne jamais journaliser contenu de planning, jetons ou secrets.
- Exports : nom neutralisé, type et taille contrôlés, URL temporaire.
- Sauvegardes et procédure de restauration réellement testées.
- Politique de rétention, export de données et suppression de compte; collecte minimale.
- Revoir les risques de partage public involontaire, accès croisé, injection, export coûteux, fuite de secret et rollback incomplet.

## 12. Tests et phases

### Tests essentiels

| Niveau | Couverture |
|---|---|
| Unitaire | Modèles, horaires traversant minuit, validation, couleurs, duplication, pagination. |
| Base | Migrations vierges/upgrade, contraintes, cascades, transactions, RLS avec A/B/anon. |
| Intégration | Auth, sauvegarde, batch, duplication, partage/révocation, export et téléchargement. |
| Parcours navigateur | Créer les cinq modèles, modifier, actualiser, retrouver, partager, révoquer et exporter. |
| Responsive/accessibilité | Téléphone, tablette, ordinateur, clavier, zoom, contraste et lecteur d’écran sur parcours clés. |
| Visuel | PDF de référence, tableau large, contenu long, multi-pages, formats papier et orientation. |
| Résilience | Perte réseau, conflit, reprise, export échoué, lien et URL expirés. |

### Phases

**0 — Cadrage :** nom, utilisateurs, gratuité, règles de grille, fuseaux, formats papier, wireframes, critères MVP et décisions d’architecture.

**1 — Fondations :** Bitbucket, Next.js, CI, Supabase local/staging/production, Auth, premières migrations/RLS et composants. Sortie : inscription fiable et pipeline vert.

**2 — Éditeur :** liste, cinq modèles, grille, couleurs/styles, sauvegarde/version, redimensionnement, duplication et suppression/restauration. Sortie : parcours sur mobile et ordinateur avec isolation par compte.

**3 — Partage/export :** liens lecture seule, expiration/révocation, aperçu, PDF/DOCX, stockage temporaire. Sortie : cas de référence validés et accès testés.

**4 — Stabilisation/lancement :** accessibilité, responsive, performance, tests RLS négatifs, restauration, surveillance, aide et documents légaux; staging puis release production.

## 13. Critères d’acceptation MVP

1. Inscription, connexion, récupération et suppression de compte fonctionnent.
2. Les cinq catégories sont disponibles avec une structure initiale adaptée.
3. Contenu, axes, dimensions, couleur et alignement sont modifiables.
4. Sauvegarde persistante avec états, erreurs et possibilité de reprise.
5. Renommage, duplication, suppression/restauration et partage révocable fonctionnent.
6. PDF et DOCX contiennent le tableau; PDF respecte le format, l’orientation, les marges et signale le débordement.
7. RLS empêche l’accès aux données d’un autre compte hors partage autorisé.
8. Interface utilisable sur petit écran, clavier et zoom; la couleur n’est pas l’unique information.
9. Parcours principaux et politiques d’accès sont testés dans CI.
10. Aucune clé privilégiée ne se trouve dans le dépôt, bundle navigateur ou journal.

## 14. Checklist de mise en production

- [ ] Les cinq modèles et états vide/chargement/erreur sont validés.
- [ ] Fuseau et premier jour de semaine sont cohérents.
- [ ] Téléphone, tablette, ordinateur, clavier et zoom sont vérifiés.
- [ ] Migrations testées depuis base vierge et version précédente.
- [ ] RLS vérifié avec propriétaire, membre, autre compte et anon.
- [ ] Suppression de compte, restauration, rotation de secrets documentées.
- [ ] Buckets privés, limites et URLs signées vérifiés.
- [ ] Lien public lecture seule, imprévisible, expirant/révocable.
- [ ] PDF contrôlé en A4/Letter, orientations et pagination.
- [ ] DOCX vérifié dans Word et LibreOffice.
- [ ] Pipeline passe lint, tests, build, migration et secrets.
- [ ] Vercel sépare variables Preview/Production; domaine, TLS et callbacks contrôlés.
- [ ] Smoke tests post-déploiement, alertes, limites de coût et contact de support configurés.
- [ ] Retour arrière applicatif et récupération des données testés.

## 15. Décisions à prendre avant de coder

1. Nom de marque, domaine et identité graphique.
2. Partage du MVP limité au lien en lecture ou invitations nominatives.
3. Modèle distinct pour événements datés; recommandé si répétition, recherche ou filtrage par période sont requis.
4. Créneaux fixes seuls ou durées libres également.
5. Moteur de génération DOCX/PDF à choisir après prototype sur les cas de référence.
6. Durée de rétention des tableaux supprimés, exports et comptes inactifs.
7. Quotas gratuits définitifs selon les coûts réels observés.

## 16. Résultat attendu

À la livraison du MVP, un étudiant ou professionnel pourra choisir un format de planification, adapter sa grille, modifier ses cases depuis mobile ou ordinateur, dupliquer son travail, partager une version en lecture et télécharger un fichier imprimable. Le code et les migrations seront versionnés dans Bitbucket; Supabase assurera l’authentification et les données avec isolation vérifiable; Vercel hébergera l’application et ses environnements séparés.

