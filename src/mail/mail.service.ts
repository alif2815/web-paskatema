import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * Pengirim email lewat SMTP (mis. Gmail dengan App Password, Brevo, dll).
 * Diatur lewat .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM.
 * Bila SMTP belum diatur, email tidak dikirim (hanya dicatat di log) dan
 * fitur yang bergantung padanya memberi tahu admin lewat log.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const env = process.env;
    this.from = env.MAIL_FROM || env.SMTP_USER || 'no-reply@paskatema.local';
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const port = Number(env.SMTP_PORT || 587);
      this.transporter = createTransport({
        host: env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      this.logger.log(`Email: SMTP ${env.SMTP_HOST}:${port}`);
    } else {
      this.transporter = null;
      this.logger.warn(
        'Email: SMTP belum diatur (SMTP_HOST/SMTP_USER/SMTP_PASS); email tidak akan terkirim',
      );
    }
  }

  get enabled(): boolean {
    return this.transporter !== null;
  }

  /** Kirim email; mengembalikan false (tanpa melempar) bila gagal/tidak aktif. */
  async send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email ke ${to} tidak dikirim: SMTP belum diatur`);
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Gagal mengirim email ke ${to}: ${String(error)}`);
      return false;
    }
  }
}
