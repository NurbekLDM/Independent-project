import { logoutAccount } from "@/lib/auth";

export async function POST() {
  return logoutAccount();
}
