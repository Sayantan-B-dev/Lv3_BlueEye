import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        
        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
        const adminPassword = process.env.ADMIN_PASSWORD?.trim();
        
        // 1. Check if it's the predefined admin from env
        if (adminEmail && credentials.email.toLowerCase() === adminEmail.toLowerCase()) {
          let matches = false;
          if (adminPasswordHash) {
            matches = await bcrypt.compare(credentials.password, adminPasswordHash);
          } else if (adminPassword) {
            matches = credentials.password === adminPassword;
          }
          if (matches) {
            return { id: "admin-static", email: adminEmail, name: "Admin", role: "admin" };
          }
        }

        // 2. Check database for regular users
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        
        if (!user || !user.password) return null;

        if (!user.isVerified) {
          throw new Error("Email not verified");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { 
          id: user._id.toString(), 
          email: user.email, 
          name: user.name, 
          role: user.role,
          username: user.username 
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          // Create new user for Google login
          await User.create({
            name: user.name,
            email: user.email || "",
            image: user.image,
            role: "user",
            isVerified: true // Google accounts are verified
          });
        } else {
          // Update existing user image if needed
          existingUser.image = user.image;
          await existingUser.save();
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        
        token.role = dbUser?.role || (user as any).role || "user";
        token.id = dbUser?._id.toString() || user.id;
        token.username = dbUser?.username || (user as any).username;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
};
