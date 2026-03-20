import { validateSession } from '../authUtils';

export async function onRequestGet({ request, env }: any) {
  try {
    const userId = await validateSession(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { results } = await env.DB.prepare('SELECT id, login FROM users WHERE id = ?').bind(userId).all();
    if (results.length === 0) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ user: results[0] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
