import { createBrowserClient } from "@supabase/ssr";
import { opcionesCookies } from "./cookies";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: opcionesCookies },
  );
}
