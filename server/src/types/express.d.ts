import type { Role } from "@prisma/client";

export type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requesterId?: number;
      isLegacyRequester?: boolean;
    }
  }
}

export {};
