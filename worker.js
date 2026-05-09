export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Password, Authorization',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const check = checkEnv(env);
      if (!check.ok) return json({ ok: false, error: check.error }, 500, corsHeaders);

      const password = request.headers.get('X-App-Password') || new URL(request.url).searchParams.get('password') || '';
      if (password !== env.APP_PASSWORD) {
        return json({ ok: false, error: 'Unauthorized: invalid APP_PASSWORD' }, 401, corsHeaders);
      }

      if (request.method === 'GET') {
        const file = await getGitHubFile(env);
        return json({
          ok: true,
          data: file.data,
          sha: file.sha,
          path: normalizedDataPath(env),
          repo: `${env.GH_OWNER}/${env.GH_REPO}`,
          branch: env.GH_BRANCH
        }, 200, corsHeaders);
      }

      if (request.method === 'POST' || request.method === 'PUT') {
        const body = await request.json().catch(() => null);
        if (!body) return json({ ok: false, error: 'Invalid JSON body' }, 400, corsHeaders);

        const data = body.data || body;
        const current = await getGitHubFile(env).catch((err) => {
          throw new Error(`Existing data.json was not found or cannot be read. Upload data.json to GitHub first and check GH_REPO / GH_BRANCH / DATA_PATH. Detail: ${err.message}`);
        });

        let result;
        let oldSha = current.sha;
        try {
          result = await putGitHubFile(env, data, current.sha);
        } catch (err) {
          // If GitHub reports a conflict because the file changed between GET and PUT,
          // fetch the latest sha and retry once. This still updates the existing file only.
          if (!/409|sha|does not match|conflict/i.test(String(err.message || err))) throw err;
          const latest = await getGitHubFile(env);
          oldSha = latest.sha;
          result = await putGitHubFile(env, data, latest.sha);
        }

        return json({
          ok: true,
          message: 'Existing data.json updated',
          oldSha,
          newSha: result.content && result.content.sha,
          sha: result.content && result.content.sha,
          path: normalizedDataPath(env),
          repo: `${env.GH_OWNER}/${env.GH_REPO}`,
          branch: env.GH_BRANCH
        }, 200, corsHeaders);
      }

      return json({ ok: false, error: 'Method not allowed' }, 405, corsHeaders);
    } catch (err) {
      return json({ ok: false, error: err.message || String(err) }, 500, corsHeaders);
    }
  }
};

function checkEnv(env) {
  const required = ['APP_PASSWORD', 'GH_TOKEN', 'GH_OWNER', 'GH_REPO', 'GH_BRANCH', 'DATA_PATH'];
  const missing = required.filter(k => !env[k]);
  if (missing.length) return { ok: false, error: `Missing environment variables: ${missing.join(', ')}` };
  return { ok: true };
}

function normalizedDataPath(env) {
  return String(env.DATA_PATH || 'data.json').trim().replace(/^\/+/, '') || 'data.json';
}

function githubApiUrl(env) {
  const path = normalizedDataPath(env);
  return `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(env.GH_BRANCH)}`;
}

function githubHeaders(env) {
  return {
    'Authorization': `Bearer ${env.GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'renqing-ledger-cloudflare-worker'
  };
}

async function getGitHubFile(env) {
  const res = await fetch(githubApiUrl(env), { method: 'GET', headers: githubHeaders(env) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json && json.message ? json.message : `GitHub GET failed: ${res.status}`);
  const content = base64ToUtf8(String(json.content || '').replace(/\n/g, ''));
  return { data: JSON.parse(content), sha: json.sha };
}

async function putGitHubFile(env, data, sha) {
  if (!sha) throw new Error('Missing existing file sha. Refusing to create a new data.json.');
  const url = githubApiUrl(env).replace(/\?ref=.*/, '');
  const payload = {
    message: `Update existing data.json ${new Date().toISOString()}`,
    content: utf8ToBase64(JSON.stringify(data, null, 2)),
    branch: env.GH_BRANCH,
    sha
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...githubHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json && json.message ? json.message : `GitHub PUT failed: ${res.status}`);
  return json;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders }
  });
}
