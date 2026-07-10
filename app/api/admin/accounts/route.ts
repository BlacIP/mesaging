import { NextRequest, NextResponse } from "next/server";
import { forbidden, getAccount, unauthorized } from "@/lib/auth";
import { listAccountsWithStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();
  if (!account.is_admin) return forbidden("Only the owner can see accounts.");

  return NextResponse.json({ accounts: await listAccountsWithStats() });
}
