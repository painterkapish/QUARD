const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../lib/supabase");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        allowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Only JPG, PNG, WEBP, or PDF allowed"));
    },
});

// POST /api/registrations — create a new registration with ID proof
router.post("/", upload.single("id_proof"), async (req, res) => {
    const { first_name, last_name, email, phone, college, category } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !college || !category) {
        return res.status(400).json({ error: "All fields are required" });
    }
    if (!req.file) {
        return res.status(400).json({ error: "ID proof is required" });
    }

    // Upload ID proof to Supabase Storage
    const ext = req.file.originalname.split(".").pop();
    const storagePath = `${Date.now()}-${email}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from("id-proofs")
        .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) {
        return res.status(500).json({ error: "Failed to upload ID proof" });
    }

    // Get a long-lived signed URL (1 year)
    const { data: signedData, error: signedError } = await supabase.storage
        .from("id-proofs")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (signedError) {
        return res.status(500).json({ error: "Failed to generate signed URL" });
    }

    // Insert registration record
    const { data, error: dbError } = await supabase
        .from("registrations")
        .insert({
            first_name,
            last_name,
            email,
            phone,
            college,
            category,
            id_proof_url: signedData.signedUrl,
            id_proof_path: storagePath,
        })
        .select()
        .single();

    if (dbError) {
        // Rollback: delete uploaded file if DB insert fails
        await supabase.storage.from("id-proofs").remove([storagePath]);
        return res.status(400).json({ error: dbError.message });
    }

    res.status(201).json(data);
});

// GET /api/registrations — get all registrations
router.get("/", async (req, res) => {
    const { category, page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("registrations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (category) query = query.eq("category", category);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/registrations/:id — get single registration
router.get("/:id", async (req, res) => {
    const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", req.params.id)
        .single();

    if (error) return res.status(404).json({ error: "Registration not found" });
    res.json(data);
});

// DELETE /api/registrations/:id — delete registration + ID proof
router.delete("/:id", async (req, res) => {
    // Fetch the record first to get storage path
    const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("id_proof_path")
        .eq("id", req.params.id)
        .single();

    if (fetchError) return res.status(404).json({ error: "Registration not found" });

    // Delete from storage
    await supabase.storage.from("id-proofs").remove([data.id_proof_path]);

    // Delete from DB
    const { error } = await supabase
        .from("registrations")
        .delete()
        .eq("id", req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

module.exports = router;