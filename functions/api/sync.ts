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

    const { results: assetResults } = await env.DB.prepare(
      'SELECT colors_json, bg_svgs_json, item_svgs_json FROM assets WHERE workspace_id = ?'
    ).bind(workspaceId).all();

    const responseData = {
      ...results[0],
      ...(assetResults.length > 0 ? assetResults[0] : {})
    };

    return new Response(JSON.stringify(responseData), {
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
    const { id, data_json, updated_at, colors_json, bg_svgs_json, item_svgs_json } = body;

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

    let assetsChanges = 0;
    if (colors_json !== undefined || bg_svgs_json !== undefined || item_svgs_json !== undefined) {
      const assetResult = await env.DB.prepare(`
        INSERT INTO assets (workspace_id, colors_json, bg_svgs_json, item_svgs_json, updated_at) 
        VALUES (?, ?, ?, ?, ?) 
        ON CONFLICT (workspace_id) DO UPDATE SET 
          colors_json = excluded.colors_json, 
          bg_svgs_json = excluded.bg_svgs_json, 
          item_svgs_json = excluded.item_svgs_json,
          updated_at = excluded.updated_at 
        WHERE assets.updated_at < excluded.updated_at
      `).bind(id, colors_json || null, bg_svgs_json || null, item_svgs_json || null, updated_at).run();
      assetsChanges = assetResult.meta?.changes || 0;
    }

    return new Response(JSON.stringify({ success: true, changes: (result.meta?.changes || 0) + assetsChanges }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
