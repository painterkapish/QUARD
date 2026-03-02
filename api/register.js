import { createClient } from "@supabase/supabase-js";
import { validateApiPayload, validateRegistrationLimit } from "./validation.js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { count, error: countError } = await supabase
            .from("registrations")
            .select("*", { count: "exact", head: true });

        if (countError) {
            return res.status(500).json({ error: "Could not verify registration limit." });
        }

        const limitCheck = validateRegistrationLimit(count);
        if (!limitCheck.valid) {
            return res.status(429).json({ error: limitCheck.error });
        }

        const {
            first_name,
            last_name,
            email,
            phone,
            college,
            category,
            id_proof_url,
            id_proof_path,
        } = req.body;

        const payloadCheck = validateApiPayload({
            first_name,
            last_name,
            email,
            phone,
            college,
            category,
            id_proof_url,
        });

        if (!payloadCheck.valid) {
            return res.status(400).json({ error: payloadCheck.error });
        }

        const { data, error: dbError } = await supabase
            .from("registrations")
            .insert({
                first_name,
                last_name,
                email,
                phone,
                college,
                category,
                id_proof_url,
                id_proof_path,
            })
            .select()
            .single();

        if (dbError) {
            return res.status(500).json({ error: "DB error: " + dbError.message });
        }

        return res.status(200).json(data);

    } catch (e) {
        return res.status(500).json({ error: "Server error: " + e.message });
    }
}