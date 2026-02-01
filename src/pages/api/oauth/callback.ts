import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const client_id = import.meta.env.OAUTH_CLIENT_ID || process.env.OAUTH_CLIENT_ID;
  const client_secret = import.meta.env.OAUTH_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET;

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }
  if (!client_id || !client_secret) {
    return new Response('Misconfigured server', { status: 500 });
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code
      })
    });
    
    if (!response.ok) {
        throw new Error('Failed to exchange token');
    }

    const data = await response.json();
    
    if (data.error) {
        return new Response(`Error: ${data.error_description}`, { status: 400 });
    }

    const token = data.access_token;
    const provider = 'github';
    
    // Decap CMS expects this message format
    const script = `
      <script>
        const content = {
            token: "${token}",
            provider: "${provider}"
        };
        
        // Post message to the opener (The CMS tab)
        window.opener.postMessage("authorization:${provider}:success:" + JSON.stringify(content), "*");
        
        // Close this auth window
        window.close();
      </script>
      <h1>Success! You're logged in.</h1>
      <p>Closing window...</p>
    `;
    
    return new Response(script, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (e) {
    console.error(e);
    return new Response('Internal Server Error', { status: 500 });
  }
}
