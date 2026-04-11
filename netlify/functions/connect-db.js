// netlify/functions/connect-db.js
// ─────────────────────────────────────────────
// Secure bridge between your frontend and Neon.
// The DATABASE_URL is stored in Netlify Dashboard → Site settings → Environment variables.
// Your frontend calls: /.netlify/functions/connect-db
// This function talks to Neon — the secret key never reaches the browser.
// ─────────────────────────────────────────────

// Uncomment and install when ready:
// const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // TODO: Uncomment when Neon is configured
    // const sql = neon(process.env.DATABASE_URL);
    // const { action, payload } = JSON.parse(event.body);
    //
    // Example actions:
    // if (action === 'getCountries') {
    //   const rows = await sql`SELECT * FROM countries ORDER BY name`;
    //   return { statusCode: 200, body: JSON.stringify(rows) };
    // }
    //
    // if (action === 'saveCountry') {
    //   await sql`INSERT INTO countries ${sql(payload)} ON CONFLICT (id) DO UPDATE SET ${sql(payload)}`;
    //   return { statusCode: 200, body: JSON.stringify({ success: true }) };
    // }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Neon connection placeholder — configure DATABASE_URL in Netlify Dashboard',
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
