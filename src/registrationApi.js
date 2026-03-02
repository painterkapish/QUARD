import { supabase } from "./supabaseClient";

// ─── Convert File to Base64 ───────────────────────────────────────────────────
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
    });
}

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
    // Convert file to base64 (no compression)
    const fileBase64 = await fileToBase64(id_proof_file);

    const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            first_name,
            last_name,
            email,
            phone,
            college,
            category,
            fileBase64,
            fileName: id_proof_file.name,
            fileType: id_proof_file.type,
        }),
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