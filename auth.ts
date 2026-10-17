import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./lib/supabase-admin";

const ADMIN_EMAILS = [
  "bsluongdinhtrung@gmail.com",
  "luongdinhtrunghue@gmail.com",
  "nguyethmu@gmail.com",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Tài khoản GPB",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailLower = String(credentials.email).trim().toLowerCase();
        const inputPassword = String(credentials.password).trim();
        const isAdmin = ADMIN_EMAILS.includes(emailLower);

        try {
          const { data: userData, error } = await supabaseAdmin
            .from("iso_users")
            .select("*")
            .eq("id", emailLower)
            .single();

          if (error || !userData) {
            console.error(`Authorize error: account ${emailLower} not found or db error:`, error?.message);
            return null;
          }

          // Reject if account is deactivated
          if (userData.active === false) {
            console.log(`Account ${emailLower} is deactivated.`);
            return null;
          }

          const storedPassword = userData.password;
          if (!storedPassword || typeof storedPassword !== "string") {
            console.error(`Authorize error: user ${emailLower} has no password configured.`);
            return null;
          }

          let isValidPassword = false;

          // 1. Check if stored password is a bcrypt hash
          if (storedPassword.startsWith("$2")) {
            isValidPassword = await bcrypt.compare(inputPassword, storedPassword);
          } else {
            // 2. Legacy plaintext password check with graceful lazy rehash
            isValidPassword = (inputPassword === storedPassword);
            if (isValidPassword) {
              try {
                const hashedPassword = await bcrypt.hash(inputPassword, 10);
                await supabaseAdmin
                  .from("iso_users")
                  .update({
                    password: hashedPassword,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", emailLower);
                console.log(`Successfully migrated user ${emailLower} password to bcrypt hash.`);
              } catch (migrateErr) {
                console.error(`Failed to migrate password to bcrypt for ${emailLower}:`, migrateErr);
              }
            }
          }

          if (isValidPassword) {
            const userIsAdmin = isAdmin || userData.role === "ADMIN";
            const mustChange = userIsAdmin ? false : userData.must_change_password !== false;

            return {
              id: emailLower,
              email: emailLower,
              name: userData.full_name || emailLower,
              role: (userIsAdmin ? "ADMIN" : "USER") as "ADMIN" | "USER",
              title: userData.title || (userIsAdmin ? "Trưởng khoa" : "Nhân viên"),
              mustChangePassword: mustChange,
            };
          }

          return null;
        } catch (error) {
          console.error("Authorize error in credentials provider:", error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.title = user.title;
        token.name = user.name;
        token.email = user.email;
        token.mustChangePassword = user.mustChangePassword;
      }
      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = (token?.id || token?.sub || session.user.id) as string;
        const emailLower = (session.user.email || token?.email || "").toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(emailLower) || token?.role === "ADMIN";
        session.user.role = token?.role || (isAdmin ? "ADMIN" : "USER");
        session.user.title = token?.title || (isAdmin ? "Trưởng khoa" : "Nhân viên");
        session.user.mustChangePassword = token?.mustChangePassword === true;
        if (token?.name) {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
