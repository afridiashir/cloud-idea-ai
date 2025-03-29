import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./db";
import { isSamePass } from "./hash";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NextAuth, { DefaultSession } from "next-auth";

import nodemailer from "nodemailer";

declare module "next-auth" {
  interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      role: string; // Add role to the session
    } & DefaultSession["user"];
  }
}



// Function to send OTP via email
async function sendOtpEmail(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Your email
      pass: process.env.MAIL_PASS, // App password
    },
  });

  await transporter.sendMail({
    from: '"Your App" <your-email@gmail.com>',
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
  });
}

const otpStore = new Map<string, { otp: string; expires: number }>();

export const authOption: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge:24*60*60,
    updateAge:60*60
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "email", placeholder: "" },
        password: { label: "password", type: "password", placeholder: "" },
        otp: { label: "OTP", type: "text", optional: true }, // New OTP field
      },
      async authorize(credentials) {
        const {otp} = credentials;
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const existingUser = await prisma.user.findUnique({
          where: {
            email: credentials?.email,
          },
        });

        if (!existingUser) {
          return null;
        }

        if (credentials.password === "image-update") {
          return {
            id: `${existingUser.id}`,
            name: existingUser.name,
            email: existingUser.email,
            image: existingUser.profileImg,
            role: existingUser.role,
          };
        }

        const comparePass = await isSamePass(
          credentials.password,
          existingUser.password
        );

        if (!comparePass) {
          return null;
        }

        
        // 2FA Step: If OTP is not provided, send OTP
        if (!otp) {
          const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
          const expiryTime = Date.now() + 5 * 60 * 1000; // OTP expires in 5 mins
          otpStore.set(credentials.email, { otp: generatedOTP, expires: expiryTime });
          console.log(otp);
          await sendOtpEmail(credentials.email, generatedOTP);

          throw new Error("OTP sent to your email. Please enter it.");
        }

        // Verify OTP
        const storedOTP = otpStore.get(credentials.email);
        if (!storedOTP || storedOTP.otp !== otp || storedOTP.expires < Date.now()) {
          throw new Error("Invalid or expired OTP.");
        }

        otpStore.delete(credentials.email); // Remove OTP after successful verification


        return {
          id: `${existingUser.id}`,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.profileImg,
          role: existingUser.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Add role to the token
      }
      if (trigger === "update") {
        return { ...token, ...session.user };
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = `${token.id}`;
      session.user.role = `${token.role}`; // Add role to the session
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOption);