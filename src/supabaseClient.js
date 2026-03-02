import { createClient } from "@supabase/supabase-js";

// ✅ FIX: Client is created once at module level (you already do this — keep it)
// This is correct. Do NOT create supabase inside functions — that causes a new
// TCP connection on every call, which is very slow on mobile.
export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,       // ✅ Reuses auth session — avoids re-auth on every request
            autoRefreshToken: true,
        },
        global: {
            fetch: (...args) => fetch(...args), // ✅ Uses native fetch (fastest on mobile browsers)
        },
        db: {
            schema: "public",
        },
        realtime: {
            enabled: false,             // ✅ Disable realtime if you don't use live subscriptions
            //    It opens a WebSocket unnecessarily, wasting mobile bandwidth
        },
    }
);