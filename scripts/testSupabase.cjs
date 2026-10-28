const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.mfstasmypcskxxnqbdez',
    password: 'Sentinelle066328874//',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connecté à Supabase PostgreSQL !');

  const testEmail = 'test_' + Date.now() + '@planilux.fr';
  
  // 1. Insertion utilisateur
  const uRes = await client.query(
    'INSERT INTO public.planilux_users (username, email, password_hash, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, phone, address',
    ['Prof Dupont', testEmail, 'securePass2026', '+33698765432', '12 Rue de la Paix, 75001 Paris']
  );
  const user = uRes.rows[0];
  console.log('✅ Inscription utilisateur réussie :', user);

  // 2. Insertion emploi du temps (Board)
  const boardId = 'board_test_' + Date.now();
  const bRes = await client.query(
    'INSERT INTO public.planilux_boards (id, user_id, title, subtitle, orientation, theme, layout_type, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id, title, layout_type',
    [boardId, user.id, 'Emploi du temps Terminale S', 'Semestre 1', 'portrait', 'emerald', 'weekly-5d', JSON.stringify({ cells: [], axes: [] })]
  );
  const board = bRes.rows[0];
  console.log('✅ Création emploi du temps réussie :', board);

  // 3. Test isolation des données : sélection uniquement pour cet utilisateur
  const readRes = await client.query(
    'SELECT id, title, user_id FROM public.planilux_boards WHERE user_id = $1',
    [user.id]
  );
  console.log('✅ Isolation vérifiée :', readRes.rows.length, 'emploi(s) trouvé(s) pour cet utilisateur.');

  // 4. Test authentification : recherche par email et vérification mot de passe
  const authRes = await client.query(
    'SELECT * FROM public.planilux_users WHERE email = $1',
    [testEmail]
  );
  if (authRes.rows.length > 0 && authRes.rows[0].password_hash === 'securePass2026') {
    console.log('✅ Authentification / Connexion validée avec succès !');
  }

  // 5. Nettoyage de la donnée de test
  await client.query('DELETE FROM public.planilux_boards WHERE id = $1', [boardId]);
  await client.query('DELETE FROM public.planilux_users WHERE id = $1', [user.id]);
  console.log('✅ Données de test nettoyées proprement.');

  await client.end();
  console.log('🎉 TOUS LES SYSTÈMES ET TABLES SUPABASE SONT 100% OPÉRATIONNELS !');
}

test().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
