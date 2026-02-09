import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { action } = body;

    // Accept invitation (no auth required)
    if (action === "accept") {
      const { token, userId } = body;
      if (!token || !userId) {
        return new Response(JSON.stringify({ error: "Missing token or userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const serviceClient = createClient(supabaseUrl, serviceRoleKey);

      // Find invitation
      const { data: inv } = await serviceClient
        .from("user_invitations")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!inv) {
        return new Response(JSON.stringify({ error: "Érvénytelen vagy lejárt meghívó" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate that the user's email matches the invitation email
      const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(userId);
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Felhasználó nem található" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userData.user.email?.toLowerCase() !== inv.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Az email cím nem egyezik a meghívóval" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign role
      await serviceClient.from("user_roles").insert({
        user_id: userId,
        role: inv.role,
      });

      // Mark invitation as used
      await serviceClient
        .from("user_invitations")
        .update({ used: true })
        .eq("id", inv.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invite user (admin only)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(jwtToken);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Csak admin hívhat meg felhasználókat" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role } = body;
    if (!email) {
      return new Response(JSON.stringify({ error: "Email szükséges" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Save invitation
    await serviceClient.from("user_invitations").insert({
      email,
      role: role || "user",
      token,
      expires_at: expiresAt,
      invited_by: callerUserId,
    });

    // Send email via Mailtrap
    const mailtrapKey = Deno.env.get("MAILTRAP_API_KEY");
    if (!mailtrapKey) {
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Meghívó létrehozva, de az email küldés nincs konfigurálva (MAILTRAP_API_KEY hiányzik).",
          token,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build invite URL - use the origin from the request or fallback
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://umbrolldashboard.lovable.app";
    const inviteUrl = `${origin}/accept-invite?token=${token}`;

    const emailRes = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailtrapKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: "noreply@yourdomain.com", name: "Umbroll" },
        to: [{ email }],
        subject: "Meghívó - Umbroll Partner Dashboard",
        text: `Meghívást kaptál az Umbroll Partner Dashboard-ra.\n\nRegisztrálj itt: ${inviteUrl}\n\nA meghívó 7 napig érvényes.`,
        html: `<h2>Umbroll Partner Dashboard</h2><p>Meghívást kaptál a <strong>${role || "user"}</strong> szerepkörrel.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#c41230;color:white;text-decoration:none;border-radius:8px">Meghívó elfogadása</a></p><p style="color:#666">A meghívó 7 napig érvényes.</p>`,
      }),
    });

    if (!emailRes.ok) {
      console.error("Mailtrap error:", await emailRes.text());
      return new Response(
        JSON.stringify({ success: true, warning: "Meghívó létrehozva, de az email küldés sikertelen." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    console.error("invite-user error:", error);
    return new Response(JSON.stringify({ error: "Belső szerverhiba" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
