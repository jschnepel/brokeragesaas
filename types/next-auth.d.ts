import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "agent" | "designer" | "marketing_manager" | "executive" | "platform_admin";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "agent" | "designer" | "marketing_manager" | "executive" | "platform_admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "agent" | "designer" | "marketing_manager" | "executive" | "platform_admin";
  }
}
