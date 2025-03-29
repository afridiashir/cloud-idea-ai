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
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudIdea Account Created</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #368dff;
            text-align: center;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #333;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">CloudIdea</div>
        <div class="content">
            <p>Hello,</p>
            <p>Your account has been created successfully!</p>
            <p><strong>Login Details:</strong></p>
            <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Please change your password after logging in for security reasons.</p>
            <p>Best Regards,<br>CloudIdea Team</p>
        </div>
        <div class="footer">&copy; 2025 CloudIdea. All rights reserved.</div>
    </div>
</body>
</html>
`,
  };

  await transporter.sendMail(mailOptions);
}
