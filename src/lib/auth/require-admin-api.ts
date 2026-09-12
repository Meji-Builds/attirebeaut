
import { NextResponse } from "next/server";
import { getAdminUser } from "./get-admin-user";


export async function requireAdminApi() {
  const result = await getAdminUser();

  if (!result.ok) {
    const status = result.reason === "no_session" ? 401 : 403;
    return {
      user: null,
      response: NextResponse.json({ error: "Not authorized" }, { status }),
    };
  }

  return { user: result.user, response: null };
}