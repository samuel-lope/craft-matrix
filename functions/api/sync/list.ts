import { validateSession } from '../authUtils';

export async function onRequestGet(context: any) {
  const { request, env } = context;

  try {
    const userId = await validateSession(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { results: workspaces } = await env.DB.prepare(
      `SELECT w.id, w.data_json, w.updated_at,
              a.colors_json, a.bg_svgs_json, a.item_svgs_json
       FROM workspaces w
       LEFT JOIN assets a ON a.workspace_id = w.id
       WHERE w.user_id = ?
       ORDER BY w.updated_at DESC`
    ).bind(userId).all();

    return new Response(JSON.stringify({ workspaces }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
