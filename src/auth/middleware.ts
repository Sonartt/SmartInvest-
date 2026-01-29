import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  role: string;
}

export async function validateAuthToken(token: string): Promise<AuthUser> {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format");
  }

  // Remove any whitespace
  const cleanToken = token.trim();

  // Validate token format (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanToken)) {
    throw new Error("Invalid token characters");
  }

  // TODO: Implement JWT verification or API key lookup
  // For now, this is a placeholder
  const user = await prisma.user.findFirst({
    where: { apiKey: cleanToken },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  return user;
}