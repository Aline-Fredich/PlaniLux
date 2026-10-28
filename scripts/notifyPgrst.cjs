const { Client } = require('pg');

async function reload() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.mfstasmypcskxxnqbdez',
    password: 'Sentinelle066328874//',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connecté à Supabase.');

  // Recharger le cache PostgREST de Supabase
  await client.query("NOTIFY pgrst, 'reload schema';");
  await client.query("NOTIFY pgrst, 'reload config';");
  console.log('✅ NOTIFY pgrst, reload schema envoyé.');

  // Ajouter à supabase_realtime
  try {
    await client.query(`
      ALTER PUBLICATION supabase_realtime ADD TABLE public.planilux_users;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.planilux_boards;
      console.log('✅ Tables ajoutées à supabase_realtime.');
    `);
  } catch(e) {
    console.log('Info publication realtime:', e.message);
  }

  // Vérifier la présence des tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log('Tables dans public:', res.rows.map(r => r.table_name));

  await client.end();
}

reload().catch(console.error);
