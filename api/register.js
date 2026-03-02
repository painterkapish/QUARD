import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false, // Important for file upload
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

    const form = formidable({ multiples: false });

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

            const file = files.college_id;

            if (!file) {
                return res.status(400).json({ error: "File missing." });
            }

            const fileBuffer = fs.readFileSync(file.filepath);
            const fileExt = file.originalFilename.split(".").pop();
            const filePath = `registrations/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("id-proofs")
                .upload(filePath, fileBuffer);

            if (uploadError) {
                return res.status(500).json({ error: "File upload failed." });
            }

            const { data: publicUrlData } = supabase.storage
                .from("id-proofs")
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;

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