import { supabase } from "./supabaseClient";

// ─── Submit Registration (data + image) ───────────────────────────────────────
export async function submitRegistration({ first_name, last_name, email, phone, college, category, id_proof_file }) {

    // 1. Upload ID proof image to Supabase Storage
    const ext = id_proof_file.name.split(".").pop();
    const filePath = `${Date.now()}-${email}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("id-proofs")
        .upload(filePath, id_proof_file);

    if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

    // 2. Get public URL of uploaded image
    const { data: urlData } = supabase.storage
        .from("id-proofs")
        .getPublicUrl(filePath);

    // 3. Save registration data to database
    const { data, error: dbError } = await supabase
        .from("registrations")
        .insert({
            first_name,
            last_name,
            email,
            phone,
            college,
            category,
            id_proof_url: urlData.publicUrl,
            id_proof_path: filePath,
        })
        .select()
        .single();

    if (dbError) throw new Error("Registration failed: " + dbError.message);

    return data;
}

// ─── Get All Registrations ────────────────────────────────────────────────────
export async function getRegistrations({ category, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("registrations")
        .select("*", { count: "exact" })
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
    // Get storage path first
    const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("id_proof_path")
        .eq("id", id)
        .single();

    if (fetchError) throw new Error("Registration not found");

    // Delete image from storage
    await supabase.storage.from("id-proofs").remove([data.id_proof_path]);

    // Delete from DB
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) throw new Error(error.message);
}