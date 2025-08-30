
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase';
import { ref, update, get } from "firebase/database";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    
    // In a real app, you would look up the user by email.
    // For this app, the username is the email (without the domain part, as per our new logic)
    const username = email.split('@')[0];
    const userRef = ref(db, `users/${username}`);
    const userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store OTP and expiry in user's record
    await update(userRef, {
      otp: otp,
      otpExpires: otpExpires,
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
      },
    });

    const mailOptions = {
      from: `"ChohanGenAI" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: 'Your ChohanGenAI Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #000;">ChohanGenAI Login Verification</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for logging into ChohanGenAI is:</p>
          <p style="font-size: 24px; font-weight: bold; color: #000; letter-spacing: 2px; border: 1px solid #ccc; padding: 10px; display: inline-block;">
            ${otp}
          </p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email or contact support if you have security concerns.</p>
          <br>
          <p>Thank you,</p>
          <p><strong>The ChohanGenAI Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
  }
}
