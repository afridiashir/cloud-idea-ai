import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOption } from "@/lib/auth";
import { hashPass } from "@/lib/hash";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  const session = await getServerSession(authOption);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email },
    });

    if (user) {
      return NextResponse.json({ error: "User Email already exists." }, { status: 500 });
    }

    const hashedPassword = await hashPass(password);

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        status: true,
        password: hashedPassword,
        profileImg: session.user.image,
        role: "sub",
        referrer_id: +session.user.id,
      },
    });

    // Send invite email
    await sendInviteEmail(email, password);

    return NextResponse.json({ msg: "User Created Successfully. Invitation sent." }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong!" }, { status: 500 });
  }
}

// Function to send an email invitation
async function sendInviteEmail(email: string, password: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Your email
      pass: process.env.MAIL_PASS, // App password (generate from Google)
    },
  });

  const mailOptions = {
    from: '"Your App" <your-email@gmail.com>',
    to: email,
    subject: "Welcome! Your Account Details",
    text: `Hello,\n\nYour account has been created successfully!\n\nLogin Details:\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in for security reasons.\n\nBest Regards,\nYour App Team`,
    html: `
      <p>Hello,</p>
      <p>Your account has been created successfully!</p>
      <p><strong>Login Details:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please change your password after logging in for security reasons.</p>
      <p>Best Regards,<br>Your App Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
