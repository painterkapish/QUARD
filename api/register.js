import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false, // Required for formidable
    },
};

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const form = formidable({
        multiples: false,
        keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: "File parsing failed." });
        }

        try {
            const {
                first_name,
                last_name,
                email,
                phone,
                college,
                category,
            } = fields;

            // 🔥 FIX STARTS HERE
            const fileArray = files.college_id;

            if (!fileArray || !fileArray[0]) {
                return res.status(400).json({ error: "File missing." });
            }

            const uploadedFile = fileArray[0];

            if (!uploadedFile.filepath) {
                return res.status(400).json({ error: "Invalid file path." });
            }

            const fileBuffer = fs.readFileSync(uploadedFile.filepath);

            const fileExt = uploadedFile.originalFilename
                ?.split(".")
                .pop();

            const filePath = `registrations/${Date.now()}.${fileExt}`;
            // 🔥 FIX ENDS HERE

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("id-proofs")
                .upload(filePath, fileBuffer, {
                    contentType: uploadedFile.mimetype,
                });

            if (uploadError) {
                return res.status(500).json({ error: uploadError.message });
            }

            const { data: publicUrlData } = supabase.storage
                .from("id-proofs")
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;

            // Insert into database
            const { error: dbError } = await supabase
                .from("registrations")
                .insert({
                    first_name,
                    last_name,
                    email,
                    phone,
                    college,
                    category,
                    id_proof_url: publicUrl,
                    id_proof_path: filePath,
                });

            if (dbError) {
                return res.status(500).json({ error: dbError.message });
            }

            return res.status(200).json({
                success: true,
                message: "Registration successful",
            });

        } catch (error) {
            return res.status(500).json({
                error: "Server error: " + error.message,
            });
        }
    });
}