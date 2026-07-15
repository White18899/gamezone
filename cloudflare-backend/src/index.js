export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers configuration
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    // Preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Routing
    if (url.pathname === "/api/data") {
      if (request.method === "GET") {
        try {
          const configStr = await env.GAMEZONE_KV.get("gz_data");
          if (!configStr) {
            // Return empty layout so frontend falls back to defaults
            return new Response(JSON.stringify({ found: false }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          return new Response(configStr, {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.text();
          // Validate JSON structure
          JSON.parse(body);
          
          await env.GAMEZONE_KV.put("gz_data", body);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
    }

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders
    });
  }
};
