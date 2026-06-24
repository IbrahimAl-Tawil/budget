import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getApiUser(request: NextRequest | Request) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request as NextRequest, secret });
  if (!token?.id) return null;
  return { id: token.id as string };
}
