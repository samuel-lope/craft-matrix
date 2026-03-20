import { hashPassword, generateSalt } from '../authUtils';

export async function onRequestPost({ request, env }: any) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return new Response(JSON.stringify({ error: 'Missing login or password' }), { status: 400 });
    }

    if (!/^[a-zA-Z0-9]+$/.test(login)) {
      return new Response(JSON.stringify({ error: 'Login must be alphanumeric' }), { status: 400 });
    }

    if (password.length > 32) {
      return new Response(JSON.stringify({ error: 'Password too long' }), { status: 400 });
    }

    const { results } = await env.DB.prepare('SELECT id FROM users WHERE login = ?').bind(login).all();
    if (results.length > 0) {
      return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const userId = crypto.randomUUID();

    await env.DB.prepare(
      'INSERT INTO users (id, login, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, login, passwordHash, salt, Date.now()).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
