
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
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;">
            <table style="width: 100%; background-color: #f7f7f7;" cellpadding="0" cellspacing="0">
                <tr>
                    <td></td>
                    <td style="display: block !important; max-width: 600px !important; margin: 0 auto !important; clear: both !important;" width="600">
                        <div style="max-width: 600px; margin: 0 auto; display: block; padding: 20px;">
                            <table style="background-color: #ffffff; border: 1px solid #e9e9e9; border-radius: 8px; width: 100%;" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 30px; text-align: center; background-color: #FFC107; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                        <h1 style="font-size: 32px; color: #1E293B; font-weight: 700; margin: 0;">ChohanGenAI</h1>
                                        <p style="font-size: 16px; color: #475569; margin-top: 5px;">Your Personal AI Assistant</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px;">
                                        <table style="width: 100%;" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom: 20px;">
                                                    <h2 style="font-size: 24px; font-weight: 600; color: #1E293B; margin: 0 0 15px;">Verification Code</h2>
                                                    <p style="margin: 0 0 10px; font-size: 16px; color: #475569;">Hello,</p>
                                                    <p style="margin: 0 0 25px; font-size: 16px; color: #475569;">Please use the following One-Time Password (OTP) to complete your login process.
                                                    </p>
                                                    <div style="text-align: center; margin-bottom: 25px;">
                                                        <span style="display: inline-block; background-color: #FFFBEB; color: #B45309; font-size: 36px; font-weight: 700; letter-spacing: 5px; padding: 15px 30px; border-radius: 8px; border: 2px dashed #FDE68A;">
                                                            ${otp}
                                                        </span>
                                                    </div>
                                                    <p style="margin: 0 0 10px; font-size: 16px; color: #475569;">This code is valid for the next <strong>10 minutes</strong>.</p>
                                                    <p style="margin: 0; font-size: 16px; color: #475569;">If you did not request this code, you can safely ignore this email.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center; padding: 20px; font-size: 12px; color: #94A3B8; background-color: #F8FAFC; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                                        &copy; ${new Date().getFullYear()} ChohanGenAI by Abdullah Developers. All Rights Reserved.
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </td>
                    <td></td>
                </tr>
            </table>
        </body>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ message: 'Failed to send OTP' }, { status: 500 });
  }
}
