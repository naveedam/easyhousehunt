import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://skvlnxlbdyjxroxwqmeq.supabase.co";

const supabaseAnonKey = "sb_publishable_sggH93LE65OahTCvRoth_g_uBrcZpaj"; // ✅ correct

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("🔥 Using NEW publishable key");