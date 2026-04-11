const { neon } = require('@neondatabase/serverless');

exports.config = { schedule: '0 * * * *' };

function htmlForCampaign(c){
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:680px;margin:0 auto;padding:24px">
      <h1 style="margin:0 0 12px">${String(c.headline || c.subject || 'AbleDinos Update')}</h1>
      <p style="font-size:15px;color:#666;margin:0 0 16px">${String(c.previewText || '')}</p>
      <div style="white-space:pre-wrap;font-size:16px;color:#222">${String(c.body || '')}</div>
      ${c.ctaLink ? `<p style="margin-top:24px"><a href="${String(c.ctaLink)}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">${String(c.ctaText || 'Read more')}</a></p>` : ''}
    </div>
  `;
}

exports.handler = async () => {
  const dbUrl = process.env.DATABASE_URL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if(!dbUrl) return { statusCode:500, body:'DATABASE_URL missing' };
  if(!apiKey || !from) return { statusCode:200, body:'Newsletter scheduler skipped: email config missing' };
  const { Resend } = require('resend');
  const resend = new Resend(apiKey);
  const sql = neon(dbUrl);
  const stateRows = await sql`SELECT value FROM app_state WHERE key = 'site_state' LIMIT 1`;
  const userRows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
  const state = stateRows[0]?.value || {};
  const users = Array.isArray(userRows[0]?.value) ? userRows[0].value : [];
  const campaigns = Array.isArray(state.newsletters) ? state.newsletters : [];
  const now = Date.now();
  let sentCount = 0;
  for (const c of campaigns) {
    if (!c || c.enabled === false || c.sentAt || !c.scheduledAt) continue;
    if (new Date(c.scheduledAt).getTime() > now) continue;
    let recipients = users.filter(u => u && u.email && u.emailVerified !== false && u.role !== 'superadmin');
    if (c.audience === 'newsletter') recipients = recipients.filter(u => u.newsletterOptIn);
    else if (c.audience === 'offers') recipients = recipients.filter(u => u.offersOptIn);
    else recipients = recipients.filter(u => u.newsletterOptIn || u.offersOptIn);
    const emails = [...new Set(recipients.map(u => String(u.email).trim().toLowerCase()).filter(Boolean))];
    if (emails.length) {
      await resend.emails.send({ from, to: emails, subject: c.subject || 'AbleDinos Update', html: htmlForCampaign(c) });
    }
    c.sentAt = new Date().toISOString();
    c.status = 'sent';
    sentCount += emails.length;
  }
  state.newsletters = campaigns;
  await sql`INSERT INTO app_state (key, value, updated_at)
            VALUES ('site_state', ${JSON.stringify(state)}::jsonb, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
  return { statusCode:200, body:`Processed newsletters. Recipients sent: ${sentCount}` };
};
