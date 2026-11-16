import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) {
      return json({ error: "Registration service is not configured. Please contact the administrator." }, 500);
    }

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone_number || "").trim();
    const password = String(body.password || "");
    const licenceNumber = String(body.licence_number || "").trim();
    const licenceExpiry = String(body.licence_expiry || "").trim();

    if (fullName.length < 2 || fullName.length > 120) return json({ error: "Enter your full name." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
    if (!phone || phone.length > 30) return json({ error: "Enter your phone number." }, 400);
    if (password.length < 8) return json({ error: "Your password must be at least 8 characters." }, 400);

    // Public registration can only create driver accounts.
    const signupClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signup, error: signupError } = await signupClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "driver", phone_number: phone },
        emailRedirectTo: "https://izaqueseb-bot.github.io/Fleet-management-/",
      },
    });
    if (signupError) return json({ error: signupError.message }, 400);
    const newUserId = signup.user?.id;
    if (!newUserId) return json({ error: "Supabase did not create the account. Please try again." }, 500);

    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUserId, full_name: fullName, role: "driver",
    }, { onConflict: "id" });
    if (profileError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return json({ error: "Could not save your driver profile: " + profileError.message }, 500);
    }

    const driverRow: Record<string, unknown> = {
      user_id: newUserId, phone_number: phone, status: "pending",
    };
    if (licenceNumber) driverRow.licence_number = licenceNumber;
    if (licenceExpiry) driverRow.licence_expiry = licenceExpiry;

    const { error: driverError } = await adminClient.from("drivers").upsert(driverRow, { onConflict: "user_id" });
    if (driverError) {
      await adminClient.from("profiles").delete().eq("id", newUserId);
      await adminClient.auth.admin.deleteUser(newUserId);
      return json({ error: "Could not save your driver details: " + driverError.message }, 500);
    }

    return json({
      success: true,
      message: "Registration received. Check your email to confirm your account, then sign in. Your fleet administrator will approve your driver profile.",
      requiresEmailConfirmation: !signup.session,
    }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});
