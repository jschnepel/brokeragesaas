import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export type PlatformRole = "agent" | "designer" | "marketing_manager" | "executive" | "platform_admin";

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
}

const DEMO_USERS: Record<string, DemoUser> = {
  yong: {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "Yong Choi",
    email: "yong@demo.local",
    role: "agent",
  },
  lex: {
    id: "a0000000-0000-0000-0000-000000000002",
    name: "Lex Baum",
    email: "lex@demo.local",
    role: "marketing_manager",
  },
  david: {
    id: "a0000000-0000-0000-0000-000000000003",
    name: "David Kim",
    email: "david@demo.local",
    role: "executive",
  },
  marcus: {
    id: "a0000000-0000-0000-0000-000000000004",
    name: "Marcus Chen",
    email: "marcus@demo.local",
    role: "designer",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Demo Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const user = DEMO_USERS[username.toLowerCase()];
        if (!user) return null;
        if (password !== username.toLowerCase()) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as DemoUser).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as DemoUser).role = token.role as PlatformRole;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
  trustHost: true,
});
