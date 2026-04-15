const emailColors = {
  primary900: '#0E163A',
  primary800: '#1A237E',
  primary700: '#26348F',
  primary600: '#2E3FA6',
  secondary700: '#155F3F',
  secondary600: 'rgb(26, 126, 81)',
  secondary500: '#23905E',
  secondary100: '#D8F0E5',
  slate900: '#101828',
  slate700: '#344054',
  slate500: '#667085',
  slate300: '#D0D5DD',
  slate100: '#EAECF0',
  slate50: '#F2F4F7',
  slate850: '#182230',
  slate750: '#1F2937',
  slate650: '#334155',
  accentBlue300: '#9CC3EA',
  primarySurface700: '#1F406A',
  secondarySubtleDark: '#1C3A2F',
  white: '#FFFFFF',
  black: '#000000',
  success600: '#16A34A',
  success500: '#22C55E',
  warning600: '#D97706',
  warning500: '#F59E0B',
  error600: '#DC2626',
  error500: '#EF4444'
}

/**
 * Renders a common email template with configurable content.
 * @param {object} options - Template options
 * @param {string} options.brandName - Brand/app name
 * @param {string} options.subjectTitle - Header title
 * @param {string} options.heading - Main heading
 * @param {string} options.introText - Intro paragraph
 * @param {string} [options.contentHtml] - Custom HTML block in body
 * @param {string} [options.ctaText] - CTA button text
 * @param {string} [options.ctaUrl] - CTA button URL
 * @param {string} [options.footerNote] - Footer info text
 * @returns {string}
 */
const renderEmailTemplate = ({
  brandName,
  subjectTitle,
  heading,
  introText,
  contentHtml,
  ctaText,
  ctaUrl,
  footerNote
}) => {
  const c = emailColors
  const currentYear = new Date().getFullYear()

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subjectTitle}</title>
    </head>
    <body style="margin:0; padding:0; background:${c.white}; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:${c.slate900};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${c.white}; padding:0; margin:0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px; background:${c.white}; border:1px solid ${c.slate100}; border-radius:10px; overflow:hidden;">
              <tr>
                <td style="height:4px; background:${c.primary700};"></td>
              </tr>
              <tr>
                <td style="background:${c.primary900}; padding:22px 24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="left">
                        <div style="display:inline-block; border:1px solid ${c.slate300}; border-radius:999px; padding:4px 10px; font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:${c.white}; margin-bottom:10px;">
                          ${brandName}
                        </div>
                        <h1 style="margin:0; font-size:22px; line-height:1.3; color:${c.white}; font-weight:700;">${subjectTitle}</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 24px;">
                  <h2 style="margin:0 0 10px; font-size:20px; color:${c.slate850}; font-weight:700;">${heading}</h2>
                  <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${c.slate650};">${introText}</p>
                  ${contentHtml || ''}
                  ${ctaText && ctaUrl
    ? `<div style="margin-top:20px; text-align:center;">
                          <a href="${ctaUrl}" style="display:inline-block; background:${c.secondary600}; color:${c.white}; text-decoration:none; padding:11px 22px; border-radius:8px; font-weight:600; font-size:14px;">
                            ${ctaText}
                          </a>
                        </div>`
    : ''}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px 18px; border-top:1px solid ${c.slate100}; background:${c.slate50};">
                  <p style="margin:0; font-size:12px; line-height:1.65; color:${c.slate500};">
                    ${footerNote || 'If you did not request this email, you can safely ignore it.'}
                  </p>
                  <p style="margin:9px 0 0; font-size:12px; color:${c.slate700}; font-weight:500;">
                    ${brandName} • © ${currentYear} All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export {
  emailColors,
  renderEmailTemplate
}
