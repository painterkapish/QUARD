import { supabase } from "./supabaseClient";

// ─── Submit Registration ──────────────────────────────────────────────────────
export async function submitRegistration({
    first_name,
    last_name,
    email,
    phone,
    college,
    category,
    id_proof_file,
}) {
    const payload = new FormData();
    payload.append("first_name", first_name);
    payload.append("last_name", last_name);
    payload.append("email", email);
    payload.append("phone", phone);
    payload.append("college", college);
    payload.append("category", category);
    payload.append("college_id", id_proof_file, id_proof_file.name);

    const res = await fetch("/api/register", {
        method: "POST",
        // Do NOT set Content-Type — browser sets multipart/form-data with boundary automatically
        body: payload,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
    }

    return res.json();
}

// ─── Get All Registrations ────────────────────────────────────────────────────
export async function getRegistrations({ category, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("registrations")
        .select("id, first_name, last_name, email, phone, college, category, created_at", {
            count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (category) query = query.eq("category", category);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return { data, total: count, page, limit };
}

// ─── Get Single Registration ──────────────────────────────────────────────────
export async function getRegistrationById(id) {
    const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw new Error("Not found");
    return data;
}

// ─── Delete Registration ──────────────────────────────────────────────────────
export async function deleteRegistration(id) {
    const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("id_proof_path")
        .eq("id", id)
        .single();

    if (fetchError) throw new Error("Registration not found");

    const [, dbResult] = await Promise.all([
        supabase.storage.from("id-proofs").remove([data.id_proof_path]),
        supabase.from("registrations").delete().eq("id", id),
    ]);

    if (dbResult.error) throw new Error(dbResult.error.message);
}