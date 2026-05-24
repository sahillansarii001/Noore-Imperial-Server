import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT,
  secure: env.SMTP.PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
});

export const sendWelcomeEmail = async (to, name) => {
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to,
    subject: 'Welcome to Noore Imperial!',
    html: `<h1>Welcome ${name}!</h1><p>Thank you for joining Noore Imperial. We're excited to have you.</p>`,
  });
};

export const sendOrderConfirmation = async (to, name, orderId, total) => {
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to,
    subject: `Order Confirmation - ${orderId}`,
    html: `<p>Hi ${name},</p><p>Your order <strong>${orderId}</strong> has been confirmed.</p><p>Total: ₹${total / 100}</p>`,
  });
};

export const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to,
    subject: 'Your OTP Code',
    html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`,
  });
};

export const sendPasswordReset = async (to, resetLink) => {
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  });
};

export const sendConsultationConfirmation = async (to, name, date, expert) => {
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to,
    subject: 'Consultation Confirmed',
    html: `<p>Hi ${name},</p><p>Your consultation with ${expert} is confirmed for ${date}.</p>`,
  });
};

export const sendCertificateEmail = async (to, name, courseName, certificateUrl) => {
  await transporter.sendMail({
    from: env.SMTP.FROM,
    to,
    subject: 'Your Certificate of Completion',
    html: `<p>Congratulations ${name}!</p><p>You have successfully completed ${courseName}.</p><p>View your certificate <a href="${certificateUrl}">here</a>.</p>`,
  });
};
