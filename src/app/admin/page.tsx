import { requireAdminPage } from "@/lib/auth/require-admin-page";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const user = await requireAdminPage();
  return <AdminDashboard userId={user.id} />;
}
