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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, code, mfaType } = await req.json();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const codeRegex = /^\d{6}$/;

    if (!userId || typeof userId !== "string" || !uuidRegex.test(userId)) {
      return new Response(JSON.stringify({ error: "Invalid userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!code || typeof code !== "string" || !codeRegex.test(code)) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!mfaType || !["email", "totp"].includes(mfaType)) {
      return new Response(JSON.stringify({ error: "Invalid MFA type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;

    if (userId !== callerUserId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: mfa, error: mfaError } = await serviceClient
      .from("user_mfa_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (mfaError || !mfa) {
      return new Response(JSON.stringify({ verified: false, error: "MFA nem található" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mfaType === "email") {
      // Check email code
      if ((mfa.email_code_attempts ?? 0) >= 5) {
        return new Response(JSON.stringify({ verified: false, error: "Túl sok próbálkozás. Kérj új kódot." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!mfa.email_code || !mfa.email_code_expires_at) {
        return new Response(JSON.stringify({ verified: false, error: "Nincs aktív kód. Kérj újat." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(mfa.email_code_expires_at) < new Date()) {
        return new Response(JSON.stringify({ verified: false, error: "A kód lejárt. Kérj újat." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (mfa.email_code !== code) {
        await serviceClient
          .from("user_mfa_settings")
          .update({ email_code_attempts: (mfa.email_code_attempts ?? 0) + 1 })
          .eq("user_id", userId);

        return new Response(JSON.stringify({ verified: false, error: "Hibás kód" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear the code after successful verification
      await serviceClient
        .from("user_mfa_settings")
        .update({ email_code: null, email_code_expires_at: null, email_code_attempts: 0 })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mfaType === "totp") {
      // Verify TOTP code server-side
      const secret = mfa.totp_secret;
      if (!secret) {
        return new Response(JSON.stringify({ verified: false, error: "TOTP nincs beállítva" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isValid = verifyTotp(secret, code);
      return new Response(JSON.stringify({ verified: isValid, error: isValid ? undefined : "Hibás kód" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ verified: false, error: "Ismeretlen MFA típus" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-mfa error:", error);
    return new Response(JSON.stringify({ error: "Váratlan hiba történt. Próbáld újra." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// TOTP verification
function verifyTotp(secret: string, code: string): boolean {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor(epoch / timeStep) + i;
    const generated = generateHotp(secret, counter);
    if (generated === code) return true;
  }
  return false;
}

function base32Decode(s: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits: number[] = [];
  for (const c of s.toUpperCase()) {
    const val = chars.indexOf(c);
    if (val === -1) continue;
    for (let i = 4; i >= 0; i--) bits.push((val >> i) & 1);
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i * 8 + j];
    bytes[i] = byte;
  }
  return bytes;
}

function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const msg = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  // HMAC-SHA1 implementation
  const blockSize = 64;
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);

  const keyBlock = key.length > blockSize ? sha1(key) : key;
  for (let i = 0; i < blockSize; i++) {
    const k = i < keyBlock.length ? keyBlock[i] : 0;
    ipad[i] = k ^ 0x36;
    opad[i] = k ^ 0x5c;
  }

  const inner = sha1(concat(ipad, msg));
  const hmac = sha1(concat(opad, inner));

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const ml = data.length * 8;
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, ml, false);

  for (let offset = 0; offset < padded.length; offset += 64) {
    const w = new Uint32Array(80);
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }

      const temp = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = rotl(b, 30) >>> 0; b = a; a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, h0, false);
  rv.setUint32(4, h1, false);
  rv.setUint32(8, h2, false);
  rv.setUint32(12, h3, false);
  rv.setUint32(16, h4, false);
  return result;
}

function rotl(n: number, s: number): number {
  return ((n << s) | (n >>> (32 - s))) >>> 0;
}
