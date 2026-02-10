import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smtpUser = Deno.env.get("MAILTRAP_SMTP_USER");
    const smtpPass = Deno.env.get("MAILTRAP_SMTP_PASS");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { userId } = await req.json();
    if (userId !== user.id)
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    // Kód generálás
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    await serviceClient
      .from("user_mfa_settings")
      .update({
        email_code: code,
        email_code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        email_code_attempts: 0,
      })
      .eq("user_id", userId);

    // Email küldés
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: '"Umbroll Security" <security@umbroll.com>',
        to: user.email,
        subject: "Umbroll MFA Kód",
        text: `A belépési kódod: ${code}`,
        html: `<h2>Belépési kód: ${code}</h2><p>10 percig érvényes.</p>`,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
