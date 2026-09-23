import type { DefaultSession } from "next-auth";

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      isSixClub: boolean;
      isIndependent: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    isSixClub?: boolean;
    isIndependent?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    isSixClub?: boolean;
    isIndependent?: boolean;
  }
}
