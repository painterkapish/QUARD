export default function handler(req, res) {
    res.status(200).json({
        ok: true,
        method: req.method,
        SUPABASE_URL: process.env.SUPABASE_URL ? "SET ✅" : "MISSING ❌",
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "SET ✅" : "MISSING ❌",
    });
}