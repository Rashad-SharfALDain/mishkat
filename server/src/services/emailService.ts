import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { CONFIG } from '../config';
dotenv.config();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface PasswordResetEmailOptions {
  to: string;
  name: string;
  role: string;
  token: string;
  expiresInMinutes?: number;
  baseUrl?: string;
}

// In-memory mailbox stores delivery metadata only; credentials are never retained here.
const devSentEmails: Array<{
  to: string;
  subject: string;
  sentAt: Date;
}> = [];

export class EmailService {
  public static isSmtpConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    );
  }

  private static getBaseUrl(explicitBaseUrl?: string): string {
    const configuredUrl = (
      CONFIG.FRONTEND_BASE_URL ||
      process.env.FRONTEND_BASE_URL ||
      process.env.APP_BASE_URL ||
      explicitBaseUrl ||
      ''
    ).trim();

    if (!configuredUrl) {
      throw new Error(
        'FRONTEND_BASE_URL is not configured. Please define FRONTEND_BASE_URL in your environment (.env) to generate valid password recovery links.'
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(configuredUrl);
    } catch {
      throw new Error('FRONTEND_BASE_URL must be a valid absolute URL (e.g. https://your-domain.edu.sa)');
    }

    if (CONFIG.APP_ENV !== 'local') {
      if (parsedUrl.protocol !== 'https:' || /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(parsedUrl.hostname)) {
        throw new Error(`Password recovery requires a public HTTPS frontend URL in ${CONFIG.APP_ENV} (localhost is not allowed)`);
      }
    }

    return configuredUrl.replace(/\/$/, '');
  }

  /**
   * Verify SMTP credentials connection (without exposing secrets)
   */
  public static async verifySmtpConnection(): Promise<{ configured: boolean; verified: boolean; message: string }> {
    if (!this.isSmtpConfigured()) {
      return { configured: false, verified: false, message: 'EMAIL_DELIVERY = NOT_CONFIGURED' };
    }
    try {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      await transporter.verify();
      return { configured: true, verified: true, message: 'EMAIL_DELIVERY = CONFIGURED' };
    } catch (err: any) {
      return { configured: true, verified: false, message: err.message || 'SMTP verification failed' };
    }
  }

  /**
   * Generic send email method supporting SMTP when configured,
   * or graceful simulated delivery in development/test mode.
   */
  public static async sendEmail(options: EmailOptions): Promise<{ success: boolean; simulated: boolean }> {
    const fromAddress = process.env.SMTP_FROM || 'مؤسسة مِشكاة التربوية <no-reply@mishkat.edu.sa>';
    const isConfigured = this.isSmtpConfigured();

    if (isConfigured) {
      try {
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const isSecure = port === 465;

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure: isSecure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });

        await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        console.log('[EmailService] EMAIL_DELIVERY = CONFIGURED (Outgoing email dispatched successfully via SMTP)');
        return { success: true, simulated: false };
      } catch (error: any) {
        console.error('[EmailService] Failed to send email via SMTP:', error.message || 'Connection error');
        throw new Error('تعذر إرسال البريد الإلكتروني عبر خادم البريد');
      }
    } else {
      // Development mode fallback: safe simulation without leaking tokens in production logs
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[EmailService - Dev Mode] EMAIL_DELIVERY = NOT_CONFIGURED (Simulated email to recipient, Subject: "${options.subject}")`);
      }
      return { success: true, simulated: true };
    }
  }

  /**
   * Send institutional Password Reset email with brand styling & RTL
   */
  public static async sendPasswordResetEmail(opts: PasswordResetEmailOptions): Promise<{ success: boolean; simulated: boolean }> {
    const baseUrl = this.getBaseUrl(opts.baseUrl);
    const resetLink = `${baseUrl}/#reset-password?token=${encodeURIComponent(opts.token)}`;
    const expiry = opts.expiresInMinutes || 60;

    // Keep only delivery metadata in memory; reset links and tokens are credentials.
    devSentEmails.push({
      to: opts.to,
      subject: 'طلب إعادة تعيين كلمة المرور — مؤسسة مِشكاة',
      sentAt: new Date(),
    });

    const roleNameAr: Record<string, string> = {
      admin: 'الإدارة',
      supervisor: 'المشرف التربوي',
      student: 'الطالب',
      parent: 'ولي الأمر',
    };
    const roleLabel = roleNameAr[opts.role.toLowerCase()] || opts.role;

    const htmlContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 32px 16px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #064e3b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #d97706;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">مؤسسة مِشكاة التربوية والتعليمية</h1>
            <p style="color: #fef3c7; margin: 6px 0 0 0; font-size: 13px;">بوابة الخدمات التعليمية والإدارية</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 17px; color: #064e3b; margin-top: 0;">السلام عليكم ورحمة الله وبركاته،</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              مرحبًا <strong>${opts.name}</strong> (${roleLabel})،<br>
              تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة مؤسسة مِشكاة.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              لتعيين كلمة مرور جديدة لحسابك، يرجى الضغط على الزر الآمن أدناه:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" style="background-color: #064e3b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; border: 1px solid #042f2e;">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.5;">
              ⚠️ <strong>تنبيهات أمنية هامة:</strong>
              <ul style="margin: 6px 0 0 0; padding-right: 20px;">
                <li>هذا الرابط صالح للاستخدام <strong>لمرة واحدة فقط</strong>.</li>
                <li>تنتهي صلاحية هذا الرابط بعد <strong>${expiry} دقيقة</strong> من وقت إرساله.</li>
                <li>إذا لم تكن قد طلبت استعادة كلمة المرور، يرجى تجاهل هذه الرسالة، وسيبقى حسابك آمنًا.</li>
                <li>لن تطلب منك المؤسسة كلمة مرورك مطلقًا عبر البريد.</li>
              </ul>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            هذه الرسالة آلية من نظام مؤسسة مِشكاة التربوية — المملكة العربية السعودية
          </div>
        </div>
      </div>
    `;

    const res = await this.sendEmail({
      to: opts.to,
      subject: 'طلب إعادة تعيين كلمة المرور — مؤسسة مِشكاة التربوية',
      html: htmlContent,
      text: `مرحبًا ${opts.name}، لإعادة تعيين كلمة مرور حسابك في مؤسسة مِشكاة، يرجى استخدام الرابط الآمن: ${resetLink} (صالح لمدة ${expiry} دقيقة لمرة واحدة فقط).`,
    });

    return res;
  }

  /**
   * Internal test helper for integration testing verification
   */
  public static getDevMailbox() {
    return devSentEmails;
  }

  public static clearDevMailbox() {
    devSentEmails.length = 0;
  }
}
