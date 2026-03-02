import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

// ✅ service_role bypasses RLS — safe only on server side
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
    api: { bodyParser: false }, // required for file uploads
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB max

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(400).json({ error: "File parse error: " + err.message });

        const first_name = fields.first_name?.[0] || fields.first_name;
        const last_name = fields.last_name?.[0] || fields.last_name;
        const email = fields.email?.[0] || fields.email;
        const phone = fields.phone?.[0] || fields.phone;
        const college = fields.college?.[0] || fields.college;
        const category = fields.category?.[0] || fields.category;
        const file = files.file?.[0] || files.file;

        if (!first_name || !last_name || !email || !phone || !college || !category || !file) {
            return res.status(400).json({ error: "All fields are required" });
        }

        try {
            // Read file from temp path
            const fileBuffer = fs.readFileSync(file.filepath);
            const ext = file.originalFilename?.split(".").pop() || "jpg";
            const safeEmail = email.replace(/[@.]/g, "_");
            const filePath = `${Date.now()}-${safeEmail}.${ext}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("id-proofs")
                .upload(filePath, fileBuffer, {
                    contentType: file.mimetype || "application/octet-stream",
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) return res.status(500).json({ error: "Upload failed: " + uploadError.message });

            // Get public URL
            const { data: urlData } = supabase.storage.from("id-proofs").getPublicUrl(filePath);

            // Insert to DB
            const { data, error: dbError } = await supabase
                .from("registrations")
                .insert({ first_name, last_name, email, phone, college, category, id_proof_url: urlData.publicUrl, id_proof_path: filePath })
                .select()
                .single();

            if (dbError) return res.status(500).json({ error: "DB error: " + dbError.message });

            return res.status(200).json(data);

        } catch (e) {
            return res.status(500).json({ error: "Server error: " + e.message });
        }
    });
}