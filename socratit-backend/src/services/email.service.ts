// ============================================================================
// EMAIL SERVICE
// Handles email sending via AWS SES or console (development)
// ============================================================================

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import {
  EmailOptions,
  VerificationEmailData,
  PasswordResetEmailData,
} from '../types';

// Create transporter based on environment
const createTransporter = () => {
  if (env.EMAIL_PROVIDER === 'console') {
    // Development: Log emails to console
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  // Production: Use AWS SES
  return nodemailer.createTransport({
    host: `email.${env.AWS_REGION}.amazonaws.com`,
    port: 587,
    secure: false,
    auth: {
      user: env.AWS_ACCESS_KEY_ID,
      pass: env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

const transporter = createTransporter();

/**
 * Send an email
 * @param options - Email options
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);

    if (env.EMAIL_PROVIDER === 'console') {
      console.log('📧 Email sent (console mode):');
      console.log('   To:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   ---');
      console.log(options.html || options.text);
      console.log('   ---');
    } else {
      console.log('📧 Email sent via SES:', info.messageId);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send email verification email
 * @param email - Recipient email
 * @param data - Verification email data
 */
export const sendVerificationEmail = async (
  email: string,
  data: VerificationEmailData
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Socratit.ai!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.firstName},</p>
            <p>Thank you for registering with Socratit.ai! To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${data.verificationLink}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.verificationLink}</p>
            <p>This verification link will expire in 1 hour.</p>
            <p>If you didn't create an account with Socratit.ai, you can safely ignore this email.</p>
            <p>Best regards,<br>The Socratit.ai Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Socratit.ai. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to Socratit.ai!

    Hi ${data.firstName},

    Thank you for registering! Please verify your email address by visiting this link:
    ${data.verificationLink}

    This link will expire in 1 hour.

    If you didn't create an account, you can ignore this email.

    Best regards,
    The Socratit.ai Team
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email Address - Socratit.ai',
    html,
    text,
  });
};

/**
 * Send password reset email
 * @param email - Recipient email
 * @param data - Password reset email data
 */
export const sendPasswordResetEmail = async (
  email: string,
  data: PasswordResetEmailData
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${data.firstName},</p>
            <p>We received a request to reset your password for your Socratit.ai account. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${data.resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${data.resetLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p style="margin: 5px 0 0 0;">This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <p>Best regards,<br>The Socratit.ai Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Socratit.ai. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Password Reset Request

    Hi ${data.firstName},

    We received a request to reset your password. Click this link to reset it:
    ${data.resetLink}

    This link will expire in 1 hour.

    If you didn't request this, you can ignore this email.

    Best regards,
    The Socratit.ai Team
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Socratit.ai',
    html,
    text,
  });
};
