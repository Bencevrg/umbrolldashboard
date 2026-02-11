import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Használjunk egy CDN alapú importot, ami stabilabb Deno-ban
import nodemailer from "https://esm.sh/nodemailer@6.9.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS kezelés
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Környezeti változók ellenőrzése az elején
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smtpUser = Deno.env.get("MAILTRAP_SMTP_USER");
    const smtpPass = Deno.env.get("MAILTRAP_SMTP_PASS");

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      throw new Error("Supabase konfiguráció hiányzik (URL vagy kulcsok).");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Hiányzó vagy hibás Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "A felhasználó nem azonosítható." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // JSON body olvasása
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Érvénytelen JSON formátum." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = body;
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "Nincs jogosultságod ehhez a művelethez." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kód generálás
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: dbError } = await serviceClient
      .from("user_mfa_settings")
      .update({
        email_code: code,
        email_code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        email_code_attempts: 0,
      })
      .eq("user_id", userId);

    if (dbError) {
      console.error("Adatbázis hiba:", dbError);
      throw new Error("Nem sikerült menteni a kódot.");
    }

    // Email küldés SMTP-vel
    if (!smtpUser || !smtpPass) {
      console.warn("MAILTRAP_SMTP_USER vagy PASS hiányzik! A kód csak adatbázisba került.");
      return new Response(
        JSON.stringify({
          success: true,
          warning: "Email rendszer nincs beállítva, de a kód generálva.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: '"Umbroll Security" <security@umbroll.com>',
      to: user.email,
      subject: "Umbroll MFA Kód",
      text: `A belépési kódod: ${code}`,
      html: `<h2>Belépési kód: ${code}</h2><p>10 percig érvényes.</p>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Végzetes hiba a send-mfa-code függvényben:", error);
    return new Response(JSON.stringify({ error: error.message || "Belső szerverhiba történt." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
