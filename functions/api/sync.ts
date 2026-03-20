export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('id');

  if (!workspaceId) {
    return new Response(JSON.stringify({ error: 'Missing workspace id' }), { status: 400 });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT data_json, updated_at FROM workspaces WHERE id = ?'
    ).bind(workspaceId).all();

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(results[0]), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { id, data_json, updated_at } = body;

    if (!id || !data_json || !updated_at) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const result = await env.DB.prepare(`
      INSERT INTO workspaces (id, data_json, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT (id) DO UPDATE SET 
        data_json = excluded.data_json, 
        updated_at = excluded.updated_at 
      WHERE workspaces.updated_at < excluded.updated_at
    `).bind(id, data_json, updated_at).run();

    return new Response(JSON.stringify({ success: true, changes: result.meta?.changes || 0 }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
