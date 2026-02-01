import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => {
  const client_id = import.meta.env.OAUTH_CLIENT_ID || process.env.OAUTH_CLIENT_ID;
  
  if (!client_id) {
    return new Response('Misconfigured: Missing OAUTH_CLIENT_ID', { status: 500 });
  }

  const scope = 'repo,user';
  // Redirect to GitHub to start auth flow
  return redirect(`https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}`);
}
