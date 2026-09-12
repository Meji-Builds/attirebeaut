
import { redirect } from "next/navigation";
import { getAdminUser } from "./get-admin-user";


export async function requireAdminPage() {
  const result = await getAdminUser();

  if (!result.ok) {
    redirect(result.reason === "no_session" ? "/login" : "/");
  }

  return result.user;
}