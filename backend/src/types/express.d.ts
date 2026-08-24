import { User, ProviderProfile, Role } from "@prisma/client";

export type AuthenticatedUser = User & {
  providerProfile?: ProviderProfile | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      auth?: {
        userId?: string;
        sessionId?: string;
      };
      rawBody?: Buffer;
    }
  }
}
