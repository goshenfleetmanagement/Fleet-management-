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
      return json({ error: "The create-driver function is missing its Supabase server configuration." }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Sign in as an administrator first." }, 401);

    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);
    if (callerError || !callerData.user) return json({ error: "Your session is invalid or has expired. Sign in again." }, 401);

    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerProfile, error: profileError } = await adminClient
      .from("profiles").select("role").eq("id", callerData.user.id).maybeSingle();
    if (profileError) return json({ error: "Could not verify administrator permissions: " + profileError.message }, 500);
    if (String(callerProfile?.role || "").toLowerCase() !== "admin") {
      return json({ error: "Only a fleet administrator can create driver accounts." }, 403);
    }

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone_number || "").trim();
    const licenceNumber = String(body.licence_number || "").trim();
    const licenceExpiry = String(body.licence_expiry || "").trim();

    if (fullName.length < 2 || fullName.length > 120) return json({ error: "Enter the driver's full name." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
    if (!phone || phone.length > 30) return json({ error: "Enter the driver's phone number." }, 400);

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: "driver", phone },
      redirectTo: "https://izaqueseb-bot.github.io/Fleet-management-/",
    });
    if (inviteError) return json({ error: inviteError.message }, 400);
    const newUserId = invited.user?.id;
    if (!newUserId) return json({ error: "Supabase did not return the invited user account." }, 500);

    const { error: saveProfileError } = await adminClient.from("profiles").upsert({
      id: newUserId, full_name: fullName, role: "driver",
    }, { onConflict: "id" });
    if (saveProfileError) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return json({ error: "The login invitation was created but the driver profile could not be saved: " + saveProfileError.message }, 500);
    }

    const driverRow: Record<string, unknown> = {
      user_id: newUserId, phone_number: phone, status: "active",
    };
    if (licenceNumber) driverRow.licence_number = licenceNumber;
    if (licenceExpiry) driverRow.licence_expiry = licenceExpiry;

    const { error: saveDriverError } = await adminClient.from("drivers").upsert(driverRow, { onConflict: "user_id" });
    if (saveDriverError) {
      await adminClient.from("profiles").delete().eq("id", newUserId);
      await adminClient.auth.admin.deleteUser(newUserId);
      return json({ error: "The login invitation was created but the driver record could not be saved: " + saveDriverError.message }, 500);
    }

    return json({
      success: true,
      message: "Driver account created. Supabase has sent an invitation email so the driver can set a password.",
      driver: { id: newUserId, full_name: fullName, email, phone_number: phone, role: "driver" },
    }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});
