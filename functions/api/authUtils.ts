export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSessionToken(): string {
  const token = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function validateSession(request: Request, env: any): Promise<string | null> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/session_id=([^;]+)/);
  if (!match) return null;
  
  const sessionId = match[1];

  const { results } = await env.DB.prepare(
    'SELECT user_id, expires_at FROM sessions WHERE id = ?'
  ).bind(sessionId).all();

  if (results.length === 0) return null;

  const session = results[0];
  if (Date.now() > session.expires_at) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return null;
  }

  return session.user_id as string;
}
