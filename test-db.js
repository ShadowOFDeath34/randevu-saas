const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.gimoglstlynigcbncppz:Randevu2026xSecurePass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require'
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
