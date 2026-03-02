import { supabase } from "./supabaseClient";

// ─── WHY IT WAS SLOW ──────────────────────────────────────────────────────────
//
// 1. NO IMAGE COMPRESSION
//    Mobile camera photos are 3MB–10MB. Uploading that over 4G/WiFi takes 5–30s.
//    Fix: Compress + resize image to under 400KB before uploading.
//
// 2. MISSING contentType IN STORAGE UPLOAD
//    Without it, Supabase has to sniff the MIME type, adding server-side overhead.
//    Fix: Always pass contentType explicitly.
//
// 3. SELECT * IN getRegistrations
//    Fetches every column including large id_proof_url strings on every list load.
//    Fix: Only select columns you actually display in list views.
//
// 4. SEQUENTIAL DELETES IN deleteRegistration
//    Storage delete ran first, then DB delete — two round trips back-to-back.
//    Fix: Run both in parallel using Promise.all().
//
// 5. NO DUPLICATE EMAIL GUARD IN UPLOAD FILE PATH
//    Emails contain @ and . which can cause subtle issues in some storage paths.
//    Fix: Sanitize the email string used in the file path.
//
// ─────────────────────────────────────────────────────────────────────────────


// ─── Image Compressor (fixes issue #1) ───────────────────────────────────────
async function compressImage(file, maxSizeKB = 400) {
    return new Promise((resolve) => {

        // Skip if not an image or already small enough
        if (!file.type.startsWith("image/") || file.size <= maxSizeKB * 1024) {
            return resolve(file);
        }

        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
            let { width, height } = img;

            // Resize: cap at 1200px on the longest side
            const MAX_DIM = 1200;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = Math.round((height / width) * MAX_DIM);
                    width = MAX_DIM;
                } else {
                    width = Math.round((width / height) * MAX_DIM);
                    height = MAX_DIM;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Re-encode as JPEG at 75% quality
            canvas.toBlob(
                (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
                "image/jpeg",
                0.75
            );
        };

        img.onerror = () => resolve(file); // fallback: use original if compression fails
        img.src = URL.createObjectURL(file);
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
    // STEP 1: Compress image before upload (fixes issue #1)
    const compressedFile = await compressImage(id_proof_file);

    // STEP 2: Build a clean, safe file path (fixes issue #5)
    const ext = compressedFile.type === "image/jpeg" ? "jpg" : id_proof_file.name.split(".").pop();
    const safeEmail = email.replace(/[@.]/g, "_");           // remove @ and . for safe path
    const filePath = `${Date.now()}-${safeEmail}.${ext}`;

    // STEP 3: Upload with explicit contentType (fixes issue #2)
    const { error: uploadError } = await supabase.storage
        .from("id-proofs")
        .upload(filePath, compressedFile, {
            contentType: compressedFile.type,   // ✅ explicit — no server-side sniffing
            cacheControl: "3600",
            upsert: false,
        });

    if (uploadError) throw new Error("Image upload failed: " + uploadError.message);

    // STEP 4: Get public URL (no network call — purely local computation)
    const { data: urlData } = supabase.storage.from("id-proofs").getPublicUrl(filePath);

    // STEP 5: Insert registration record
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

    // ✅ FIX (issue #3): Don't SELECT * — only fetch columns needed for list view
    // id_proof_url is a long string; skip it here, fetch it only in getRegistrationById
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
        .select("*")           // full data fine here — single record
        .eq("id", id)
        .single();

    if (error) throw new Error("Not found");
    return data;
}


// ─── Delete Registration ──────────────────────────────────────────────────────
export async function deleteRegistration(id) {
    // Fetch the file path first (needed for storage delete)
    const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("id_proof_path")
        .eq("id", id)
        .single();

    if (fetchError) throw new Error("Registration not found");

    // ✅ FIX (issue #4): Run storage + DB delete in parallel — saves one full round trip
    const [, dbResult] = await Promise.all([
        supabase.storage.from("id-proofs").remove([data.id_proof_path]),
        supabase.from("registrations").delete().eq("id", id),
    ]);

    if (dbResult.error) throw new Error(dbResult.error.message);
}