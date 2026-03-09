import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "agent" | "marketing_manager" | "executive";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "agent" | "marketing_manager" | "executive";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "agent" | "marketing_manager" | "executive";
  }
}
