import nodemailer from 'nodemailer'
import config from 'config'
import { logger } from './logger.js'
import { renderEmailTemplate, emailColors } from './email-template.js'

/**
 * Email service using Nodemailer
 */
const mailService = {
  /**
   * Initialize mail transporter
   * @returns {object} nodemailer transporter
   */
  getTransporter: () => {
    const mailConfig = config.has('mail') ? config.get('mail') : {}
    // Use MAIL_USER for Mailtrap/custom SMTP, fallback to MAIL_FROM for Gmail
    const authUser = process.env.MAIL_USER || process.env.MAIL_FROM || mailConfig.user || mailConfig.from
    const authPass = process.env.MAIL_PASSWORD || mailConfig.password

    if (!authUser || !authPass) {
      throw new Error('SMTP credentials missing. Set MAIL_USER and MAIL_PASSWORD in .env')
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || mailConfig.host || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT) || mailConfig.port || 587,
      secure: process.env.MAIL_SECURE === 'true' || mailConfig.secure === true || false,
      auth: {
        user: authUser,
        pass: authPass
      }
    })
    return transporter
  },

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - One-time password
   * @returns {Promise<object>}
   */
  sendOTPEmail: async (email, otp) => {
    try {
      const transporter = mailService.getTransporter()
      const mailConfig = config.has('mail') ? config.get('mail') : {}

      const otpBlock = `
        <div style="margin:18px 0; padding:18px; background:${emailColors.secondary100}; border:1px solid ${emailColors.slate100}; border-radius:12px; text-align:center;">
          <div style="font-size:12px; color:${emailColors.slate700}; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px;">One Time Password</div>
          <div style="font-size:34px; letter-spacing:8px; font-weight:700; color:${emailColors.primary800};">${otp}</div>
        </div>
        <p style="margin:0; font-size:14px; color:${emailColors.slate650};">This OTP expires in 10 minutes.</p>
      `

      const mailOptions = {
        from: mailConfig.from || process.env.MAIL_FROM || 'noreply@brokergrid.com',
        to: email,
        subject: 'Email Verification - OTP',
        html: renderEmailTemplate({
          brandName: 'BrokrGrid',
          subjectTitle: 'Email Verification',
          heading: 'Confirm Your Email Address',
          introText: 'Use the one-time password below to verify your email and continue securely.',
          contentHtml: otpBlock,
          footerNote: 'If you did not request this OTP, ignore this message and keep your account secure.'
        })
      }

      const info = await transporter.sendMail(mailOptions)
      logger.info(`OTP email sent to ${email}`)
      return {
        success: true,
        messageId: info.messageId
      }
    } catch (error) {
      logger.error(`Error sending OTP email to ${email}:`, error)
      throw error
    }
  },

  /**
   * Send verification confirmation email
   * @param {string} email - Recipient email
   * @param {string} name - User name
   * @returns {Promise<object>}
   */
  sendVerificationConfirmation: async (email, name) => {
    try {
      const transporter = mailService.getTransporter()
      const mailConfig = config.has('mail') ? config.get('mail') : {}

      const confirmationBlock = `
        <div style="margin:18px 0; padding:16px 18px; background:${emailColors.secondary100}; border:1px solid ${emailColors.slate100}; border-radius:12px;">
          <p style="margin:0; font-size:14px; line-height:1.7; color:${emailColors.secondarySubtleDark};">
            Your email has been verified successfully. You can now access all account features.
          </p>
        </div>
      `

      const mailOptions = {
        from: mailConfig.from || process.env.MAIL_FROM || 'noreply@brokergrid.com',
        to: email,
        subject: 'Email Verified - Welcome to BrokrGrid',
        html: renderEmailTemplate({
          brandName: 'BrokrGrid',
          subjectTitle: 'Email Verified',
          heading: `Welcome${name ? `, ${name}` : ''}`,
          introText: 'Your email is confirmed and your account is ready.',
          contentHtml: confirmationBlock,
          ctaText: 'Go to Login',
          ctaUrl: `${process.env.APP_URL || 'https://brokergrid.com'}/login`,
          footerNote: 'Need help? Reply to this email and our support team will assist you.'
        })
      }

      const info = await transporter.sendMail(mailOptions)
      logger.info(`Verification confirmation email sent to ${email}`)
      return {
        success: true,
        messageId: info.messageId
      }
    } catch (error) {
      logger.error(`Error sending verification confirmation email to ${email}:`, error)
      throw error
    }
  }
}

export default mailService
