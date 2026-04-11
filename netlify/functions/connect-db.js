const { neon } = require('@neondatabase/serverless');

const DEFAULT_SUPERADMIN = {
  id:'superadmin-1',
  email:'esraigroup@gmail.com',
  password:'super123',
  firstName:'Esrai',
  lastName:'Group',
  name:'Esrai Group',
  screenName:'Super Admin',
  provider:'email',
  role:'superadmin',
  joinedAt:new Date().toISOString(),
  mobile:'',dob:'',gender:'',ageGroup:'',nationality:'',city:'',state:'',country:'',pinCode:'',travelStyle:'',budget:'',interests:[],avatar:''
};

function json(body, statusCode=200){
  return { statusCode, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) };
}

function normalizeUsers(users){
  const list = Array.isArray(users) ? users.filter(Boolean) : [];
  const hasSuper = list.some(u => String(u.email || '').toLowerCase() === 'esraigroup@gmail.com');
  if(!hasSuper) list.unshift({ ...DEFAULT_SUPERADMIN });
  return list;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json({ error:'Method not allowed' }, 405);

  const dbUrl = process.env.DATABASE_URL;
  if(!dbUrl) return json({ error:'DATABASE_URL is not configured in Netlify environment variables.' }, 500);

  try {
    const sql = neon(dbUrl);
    await sql`CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    const body = JSON.parse(event.body || '{}');
    const action = body.action;
    const payload = body.payload || {};

    if (action === 'getState') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'site_state' LIMIT 1`;
      return json({ state: rows[0]?.value || null });
    }

    if (action === 'saveState') {
      const state = payload.state;
      if(!state || typeof state !== 'object') return json({ error:'Missing state payload' }, 400);
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('site_state', ${JSON.stringify(state)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      return json({ ok:true });
    }

    if (action === 'getUsers') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const users = normalizeUsers(rows[0]?.value || []);
      if(!rows.length){
        await sql`INSERT INTO app_state (key, value, updated_at)
                  VALUES ('users', ${JSON.stringify(users)}::jsonb, NOW())
                  ON CONFLICT (key) DO NOTHING`;
      }
      return json({ users });
    }

    if (action === 'saveUsers') {
      const users = normalizeUsers(payload.users);
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('users', ${JSON.stringify(users)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      return json({ ok:true });
    }

    return json({ error:'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error.message || 'Unexpected error' }, 500);
  }
};
