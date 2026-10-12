import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    console.warn("[Email Service] SMTP configuration is incomplete. Emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
};

export const sendPasswordResetEmail = async (toEmail, tempPassword) => {
  const mailer = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "Aptionix";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const frontendUrl = process.env.FRONTEND_URL;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: "Aptionix Admin — Password Reset",
    html: `
      <div style="font-family: 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 15px;">A temporary password was requested for your Aptionix Admin account.</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <span style="font-size: 22px; font-weight: 700; letter-spacing: 3px; color: #1e293b;">${tempPassword}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This temporary password will expire in 1 hour. You will be prompted to set a new password upon logging in.</p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${frontendUrl}/login" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Go to Login</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">If you did not request this change, please contact your system administrator.</p>
      </div>
    `,
  };

  if (!mailer) {
    console.log(`[Email Simulation] Reset password for ${toEmail}: ${tempPassword}`);
    return { success: true, simulated: true };
  }

  return await mailer.sendMail(mailOptions);
};

export const sendClientApprovalEmail = async ({ toEmail, contactName, companyName, loginId, password }) => {
  const mailer = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "Aptionix";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const frontendUrl = process.env.FRONTEND_URL;
  const loginUrl = `${frontendUrl}/client/login`;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `Welcome to ${fromName} — Your Client Account Has Been Approved!`,
    html: `
      <div style="font-family: 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; font-size: 24px; font-weight: 700; margin: 0;">${fromName}</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Client Portal Access</p>
        </div>

        <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Congratulations, ${contactName}!</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Your registration for <strong>${companyName}</strong> has been officially approved. Your personal client portal is now active and ready to access.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #1e293b; font-size: 15px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Client Credentials</h3>
          
          <table style="width: 100%; font-size: 14px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; width: 140px;">Login ID / Username:</td>
              <td style="padding: 6px 0;"><code style="background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 6px; font-weight: 700;">${loginId}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Registered Email:</td>
              <td style="padding: 6px 0;">${toEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Temporary Password:</td>
              <td style="padding: 6px 0;"><code style="background: #e2e8f0; color: #0f172a; padding: 3px 8px; border-radius: 6px; font-weight: 700; letter-spacing: 1px;">${password}</code></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600;">Login URL:</td>
              <td style="padding: 6px 0;"><a href="${loginUrl}" style="color: #4f46e5; text-decoration: underline;">${loginUrl}</a></td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            Log In to Client Portal
          </a>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 24px;">
          For security purposes, you can update your profile information and change your password in the Profile section of your client dashboard.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 28px; text-align: center; color: #94a3b8; font-size: 12px;">
          &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
        </div>
      </div>
    `,
  };

  if (!mailer) {
    console.log(`[Email Simulation] Client approval sent to ${toEmail} | Login ID: ${loginId} | Password: ${password} | URL: ${loginUrl}`);
    return { success: true, simulated: true };
  }

  return await mailer.sendMail(mailOptions);
};

export const sendClientPasswordResetEmail = async ({ toEmail, contactName, companyName, loginId, tempPassword }) => {
  const mailer = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "Aptionix";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const frontendUrl = process.env.FRONTEND_URL;
  const loginUrl = `${frontendUrl}/client/login`;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `${fromName} Client Portal — Password Reset`,
    html: `
      <div style="font-family: 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Client Portal Password Reset</h2>
        <p style="color: #475569; font-size: 15px;">Hello ${contactName || "Client"},</p>
        <p style="color: #475569; font-size: 14px;">A temporary password was requested for your account (<strong>${companyName}</strong>).</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 14px; color: #475569;">Login ID: <strong style="color: #1e293b;">${loginId}</strong></p>
          <p style="margin: 8px 0; font-size: 14px; color: #475569;">Temporary Password: <strong style="color: #4f46e5; font-size: 16px;">${tempPassword}</strong></p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="display: inline-block; padding: 11px 26px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
            Go to Client Login
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Once logged in, you can update your password in your client profile.
        </p>
      </div>
    `,
  };

  if (!mailer) {
    console.log(`[Email Simulation] Client Password Reset for ${toEmail}: ${tempPassword} (Login ID: ${loginId})`);
    return { success: true, simulated: true };
  }

  return await mailer.sendMail(mailOptions);
};

export const sendClientDirectLinkEmail = async ({ toEmail, contactName, companyName, directUrl }) => {
  const mailer = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "Aptionix";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `${companyName} — Your Client Profile Access Link`,
    html: `
      <div style="font-family: 'Quicksand', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; font-size: 24px; font-weight: 700; margin: 0;">${fromName}</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Client Profile Overview</p>
        </div>

        <h2 style="color: #0f172a; font-size: 19px; margin-top: 0;">Hello, ${contactName || "Valued Client"}!</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Your client account for <strong>${companyName}</strong> has been created. You can review your profile information directly using your private access link below.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 22px 0;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">
            <strong style="color: #1e293b;">Note:</strong> No login ID or password is required. This private link provides direct access to your profile.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${directUrl}" style="display: inline-block; padding: 13px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            View Your Profile
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          If the button doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${directUrl}" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">${directUrl}</a>
        </p>

        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
        </div>
      </div>
    `,
  };

  if (!mailer) {
    console.log(`[Email Simulation] Direct link sent to ${toEmail} | URL: ${directUrl}`);
    return { success: true, simulated: true };
  }

  return await mailer.sendMail(mailOptions);
};


