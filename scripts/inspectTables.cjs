const { Client } = require('pg');

async function check() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.mfstasmypcskxxnqbdez',
    password: 'Sentinelle066328874//',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log('Tables dans le schéma public :', res.rows);

  // Vérifier aussi les permissions et publication supabase_realtime
  const grants = await client.query(`
    SELECT grantee, table_name, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'public' 
    AND table_name IN ('planilux_users', 'planilux_boards')
    AND grantee IN ('anon', 'authenticated', 'service_role');
  `);
  console.log('Grants anon/authenticated/service_role :', grants.rows);

  await client.end();
}

check().catch(console.error);
