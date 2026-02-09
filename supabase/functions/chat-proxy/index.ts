import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEBHOOK_URLS: Record<string, string> = {
  quick: "https://bencevrg.app.n8n.cloud/webhook/87270230-ca97-4dad-812a-9c90c1394484",
  thinking: "https://bencevrg.app.n8n.cloud/webhook/abbd5cc8-81b1-433d-9d70-52efce34799d",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { mode, message, history, sessionId } = body;

    // Validate inputs
    if (!mode || !["quick", "thinking"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 10000) {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate sessionId format
    const sanitizedSessionId = typeof sessionId === "string" && /^[a-zA-Z0-9\-_]{0,100}$/.test(sessionId) ? sessionId : "";

    // Validate and sanitize history array
    const sanitizedHistory: { role: string; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-50)) {
        if (
          item &&
          typeof item === "object" &&
          typeof item.role === "string" &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string" &&
          item.content.length <= 5000
        ) {
          sanitizedHistory.push({ role: item.role, content: item.content });
        }
      }
    }

    const apiKey = Deno.env.get("N8N_CHAT_API_KEY");
    if (!apiKey) {
      console.error("N8N_CHAT_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = WEBHOOK_URLS[mode];
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        message,
        history: sanitizedHistory,
        sessionId: sanitizedSessionId,
      }),
    });

    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat-proxy error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
