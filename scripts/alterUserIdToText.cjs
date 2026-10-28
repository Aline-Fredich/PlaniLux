const { Client } = require('pg');

async function alter() {
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'mfstasmypcskxxnqbdez';
  const password = process.env.SUPABASE_DB_PASSWORD;
  const host = process.env.SUPABASE_DB_HOST || 'aws-0-eu-west-1.pooler.supabase.com';
  const port = Number(process.env.SUPABASE_DB_PORT) || 6543;
  const user = process.env.SUPABASE_DB_USER || `postgres.${projectRef}`;

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connecté à Supabase.');

  await client.query(`
    ALTER TABLE public.planilux_users ALTER COLUMN id TYPE TEXT;
    ALTER TABLE public.planilux_users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    NOTIFY pgrst, 'reload schema';
    NOTIFY pgrst, 'reload config';
  `);
  console.log('✅ Colonne id changée en TEXT avec succès !');

  const check = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'planilux_users' AND column_name = 'id';
  `);
  console.log('Type actuel de planilux_users.id :', check.rows[0]);

  await client.end();
}

alter().catch(console.error);
