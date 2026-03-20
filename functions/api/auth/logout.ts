export async function onRequestPost({ request, env }: any) {
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/session_id=([^;]+)/);
      if (match) {
        const sessionId = match[1];
        await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
      }
    }

    const cookie = `session_id=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0`;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
