import { hashPassword, generateSessionToken } from '../authUtils';

export async function onRequestPost({ request, env }: any) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const { results } = await env.DB.prepare('SELECT id, password_hash, salt FROM users WHERE login = ?').bind(login).all();
    
    if (results.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const user = results[0];
    const hash = await hashPassword(password, user.salt);

    if (hash !== user.password_hash) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    const sessionId = generateSessionToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run();

    const cookie = `session_id=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`;

    return new Response(JSON.stringify({ success: true, user: { id: user.id, login } }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
