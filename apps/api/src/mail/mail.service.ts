import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      throw new Error('SMTP configuration is missing');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    const from = this.config.get<string>('MAIL_FROM');

    if (!from) {
      throw new Error('MAIL_FROM is missing');
    }

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });
  }
}
