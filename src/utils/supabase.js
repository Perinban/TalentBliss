import { createClient } from "@supabase/supabase-js/src";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

const getSupabaseClient = (supabaseAccessToken) => {
    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Attach auth header dynamically on each request
    supabase.auth.getSession = async () => ({
        data: {
            session: {
                access_token: supabaseAccessToken,
            },
        },
        error: null,
    });

    return supabase;
};

export default getSupabaseClient;