
import { createClient } from "@/lib/supabase/server";

export type AdminCheckResult =
  | { ok: true; user: { id: string; role: string } }
  | { ok: false; reason: "no_session" | "not_admin" };


export async function getAdminUser(): Promise<AdminCheckResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "no_session" };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();


  if (error || !profile || profile.role !== "admin") {
    return { ok: false, reason: "not_admin" };
  }

  return { ok: true, user: { id: user.id, role: profile.role } };
}