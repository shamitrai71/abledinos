const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

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



function sanitizeUser(user){
  if(!user) return null;
  const clone = { ...user };
  delete clone.password;
  delete clone.verificationToken;
  delete clone.verificationTokenExpiresAt;
  delete clone.resetToken;
  delete clone.resetTokenExpiresAt;
  return clone;
}

async function sendVerificationEmail({ to, firstName, verificationUrl }){
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if(!apiKey || !from){
    return { ok:false, skipped:true, message:'RESEND_API_KEY or EMAIL_FROM is not configured.' };
  }
  const { Resend } = require('resend');
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: 'Verify your AbleDinos account',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        <h2>Verify your email</h2>
        <p>Hello ${String(firstName || 'there')},</p>
        <p>Thanks for signing up for AbleDinos. Please verify your email to activate your account.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px">Verify email</a></p>
        <p>If the button does not work, copy this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `
  });
  return { ok:true };
}

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

function recipientsForAudience(users, audience){
  let recipients = (Array.isArray(users) ? users : []).filter(u => u && u.email && u.emailVerified !== false && u.role !== 'superadmin');
  if (audience === 'newsletter') recipients = recipients.filter(u => u.newsletterOptIn);
  else if (audience === 'offers') recipients = recipients.filter(u => u.offersOptIn);
  else recipients = recipients.filter(u => u.newsletterOptIn || u.offersOptIn);
  return [...new Set(recipients.map(u => String(u.email).trim().toLowerCase()).filter(Boolean))];
}

function normalizeUsers(users){
  const list = Array.isArray(users) ? users.filter(Boolean) : [];
  const hasSuper = list.some(u => String(u.email || '').toLowerCase() === 'esraigroup@gmail.com');
  if(!hasSuper) list.unshift({ ...DEFAULT_SUPERADMIN, emailVerified:true });
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

    if (action === 'signup') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const users = normalizeUsers(rows[0]?.value || []);
      const email = String(payload.email || '').trim().toLowerCase();
      const password = String(payload.password || '');
      const firstName = String(payload.firstName || '').trim();
      const lastName = String(payload.lastName || '').trim();
      if(!email || !password || !firstName || !lastName){
        return json({ error:'Missing required signup fields.' }, 400);
      }
      if(users.some(u => String(u.email || '').trim().toLowerCase() === email)){
        return json({ error:'An account with this email already exists.' }, 409);
      }
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 24*60*60*1000).toISOString();
      const user = {
        id: payload.id || ('user-' + Date.now()),
        email,
        password,
        firstName,
        lastName,
        name: payload.name || (firstName + ' ' + lastName).trim(),
        screenName: payload.screenName || firstName,
        provider: 'email',
        role: payload.role || 'user',
        joinedAt: new Date().toISOString(),
        mobile: payload.mobile || '',
        dob: payload.dob || '',
        gender: payload.gender || '',
        ageGroup: payload.ageGroup || '',
        nationality: payload.nationality || '',
        city: payload.city || '',
        state: payload.state || '',
        country: payload.country || '',
        pinCode: payload.pinCode || '',
        travelStyle: payload.travelStyle || '',
        budget: payload.budget || '',
        interests: Array.isArray(payload.interests) ? payload.interests : [],
        avatar: payload.avatar || '',
        emailVerified: false,
        newsletterOptIn: !!payload.newsletterOptIn,
        offersOptIn: !!payload.offersOptIn,
        termsAccepted: !!payload.termsAccepted,
        termsAcceptedAt: payload.termsAcceptedAt || new Date().toISOString(),
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt
      };
      users.push(user);
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('users', ${JSON.stringify(users)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      const origin = String(payload.origin || event.headers.origin || '').replace(/\/$/, '');
      const verificationUrl = origin ? `${origin}/?verify_email=${token}` : `/?verify_email=${token}`;
      const emailResult = await sendVerificationEmail({ to: email, firstName, verificationUrl });
      return json({ ok:true, requiresVerification:true, emailSent: !!emailResult.ok, emailConfigMissing: !!emailResult.skipped, verificationUrl: emailResult.skipped ? verificationUrl : undefined, user: sanitizeUser(user) });
    }

    if (action === 'verifyEmail') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const users = normalizeUsers(rows[0]?.value || []);
      const token = String(payload.token || '').trim();
      if(!token) return json({ error:'Missing verification token.' }, 400);
      const idx = users.findIndex(u => String(u.verificationToken || '') === token);
      if(idx < 0) return json({ error:'This verification link is invalid or has already been used.' }, 404);
      const user = users[idx];
      if(user.verificationTokenExpiresAt && new Date(user.verificationTokenExpiresAt).getTime() < Date.now()){
        return json({ error:'This verification link has expired. Please request a new verification email.' }, 410);
      }
      users[idx] = { ...user, emailVerified:true, verificationToken:'', verificationTokenExpiresAt:'' };
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('users', ${JSON.stringify(users)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      return json({ ok:true, user: sanitizeUser(users[idx]) });
    }

    if (action === 'resendVerification') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const users = normalizeUsers(rows[0]?.value || []);
      const email = String(payload.email || '').trim().toLowerCase();
      const idx = users.findIndex(u => String(u.email || '').trim().toLowerCase() === email);
      if(idx < 0) return json({ error:'No account found for that email.' }, 404);
      const existing = users[idx];
      if(existing.emailVerified) return json({ ok:true, alreadyVerified:true });
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 24*60*60*1000).toISOString();
      users[idx] = { ...existing, verificationToken: token, verificationTokenExpiresAt: expiresAt };
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('users', ${JSON.stringify(users)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      const origin = String(payload.origin || event.headers.origin || '').replace(/\/$/, '');
      const verificationUrl = origin ? `${origin}/?verify_email=${token}` : `/?verify_email=${token}`;
      const emailResult = await sendVerificationEmail({ to: email, firstName: existing.firstName, verificationUrl });
      return json({ ok:true, emailSent: !!emailResult.ok, emailConfigMissing: !!emailResult.skipped, verificationUrl: emailResult.skipped ? verificationUrl : undefined });
    }

    if (action === 'sendNewsletterNow') {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM;
      if(!apiKey || !from) return json({ error:'RESEND_API_KEY or EMAIL_FROM is not configured.' }, 500);
      const campaign = payload.campaign || {};
      if(!campaign.subject || !campaign.body) return json({ error:'Campaign subject and body are required.' }, 400);
      const stateRows = await sql`SELECT value FROM app_state WHERE key = 'site_state' LIMIT 1`;
      const userRows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const state = stateRows[0]?.value || {};
      const users = normalizeUsers(userRows[0]?.value || []);
      const emails = recipientsForAudience(users, campaign.audience || 'all_opted_in');
      if(!emails.length) return json({ error:'No matching recipients found for this audience.' }, 400);
      const { Resend } = require('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: emails,
        subject: campaign.subject || 'AbleDinos Update',
        html: htmlForCampaign(campaign)
      });
      const campaigns = Array.isArray(state.newsletters) ? state.newsletters : [];
      const sentAt = new Date().toISOString();
      const idx = campaigns.findIndex(x => String(x.id || '') === String(campaign.id || ''));
      if(idx >= 0){
        campaigns[idx] = { ...campaigns[idx], sentAt, status:'sent', updatedAt: sentAt };
      }
      state.newsletters = campaigns;
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('site_state', ${JSON.stringify(state)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      return json({ ok:true, recipientCount: emails.length, sentAt });
    }

    if (action === 'login') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const users = normalizeUsers(rows[0]?.value || []);
      const email = String(payload.email || '').trim().toLowerCase();
      const password = String(payload.password || '');
      const user = users.find(u => String(u.email || '').trim().toLowerCase() === email);
      if(!user || String(user.password || '') !== password){
        return json({ error:'Invalid email or password.' }, 401);
      }
      if(user.role !== 'superadmin' && !user.emailVerified){
        return json({ error:'Please verify your email before logging in.', requiresVerification:true, email:user.email }, 403);
      }
      return json({ ok:true, user: sanitizeUser(user) });
    }

    if (action === 'changePassword') {
      const rows = await sql`SELECT value FROM app_state WHERE key = 'users' LIMIT 1`;
      const users = normalizeUsers(rows[0]?.value || []);
      const email = String(payload.email || '').trim().toLowerCase();
      const currentPassword = String(payload.currentPassword || '');
      const newPassword = String(payload.newPassword || '');
      const idx = users.findIndex(u => String(u.email || '').trim().toLowerCase() === email);
      if(idx < 0) return json({ error:'Account not found.' }, 404);
      if(String(users[idx].password || '') !== currentPassword) return json({ error:'Current password is incorrect.' }, 401);
      if(newPassword.length < 6) return json({ error:'New password must be at least 6 characters.' }, 400);
      users[idx] = { ...users[idx], password: newPassword };
      await sql`INSERT INTO app_state (key, value, updated_at)
                VALUES ('users', ${JSON.stringify(users)}::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      return json({ ok:true, user: sanitizeUser(users[idx]) });
    }

    return json({ error:'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error.message || 'Unexpected error' }, 500);
  }
};
