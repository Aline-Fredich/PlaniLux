const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const projectRef = 'mfstasmypcskxxnqbdez';
  const password = 'Sentinelle066328874//';
  const host = 'aws-0-eu-west-1.pooler.supabase.com';
  const port = 6543;
  const user = `postgres.${projectRef}`;

  console.log(`🚀 Connexion à Supabase (${host}:${port}, user: ${user})...`);
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  try {
    await client.connect();
    console.log('✅ Connecté avec succès à la base de données PostgreSQL Supabase !');

    const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_schema.sql'), 'utf8');
    console.log('⚡ Application du schéma et des migrations SQL...');
    await client.query(sql);
    console.log('✅ Exécution du schéma SQL terminée avec succès !');

    // Vérification des tables créées
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('planilux_users', 'planilux_boards')
      ORDER BY table_name, ordinal_position;
    `);

    console.log('\n📊 Tables et colonnes créées dans Supabase :');
    const tableCols = {};
    for (const r of res.rows) {
      if (!tableCols[r.table_name]) tableCols[r.table_name] = [];
      tableCols[r.table_name].push(`${r.column_name} (${r.data_type})`);
    }

    for (const [t, cols] of Object.entries(tableCols)) {
      console.log(`\n👉 Table [${t}] :`);
      cols.forEach(c => console.log(`   - ${c}`));
    }

    // Vérification des politiques RLS
    const rls = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);
    console.log('\n🔒 Politiques de sécurité RLS actives :');
    rls.rows.forEach(p => console.log(`   - [${p.tablename}] ${p.policyname} (${p.cmd})`));

    await client.end();
    console.log('\n🎉 TOUTES LES MIGRATIONS SUPABASE ONT ÉTÉ APPLIQUÉES AVEC SUCCÈS !');
  } catch (err) {
    console.error('❌ Erreur lors de la migration Supabase:', err);
    try { await client.end(); } catch(e) {}
    process.exit(1);
  }
}

run();
