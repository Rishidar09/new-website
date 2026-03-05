const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const FROM = `"IndusInnovate Technologies" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`;

// ─── Send Welcome Email ──────────────────────────────────────────
const sendWelcomeEmail = async ({ to, name, email, password, role }) => {
    await transporter.sendMail({
        from: FROM,
        to,
        subject: 'Welcome to IndusInnovate Technologies – Your Account Details',
        html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#1E3A8A,#3B82F6);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">IndusInnovate Technologies</h1>
                <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">HR Management Portal</p>
            </div>
            <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
                <h2 style="color:#111827;">Welcome, ${name}!</h2>
                <p style="color:#6B7280;">Your ${role} account has been created successfully. Here are your login credentials:</p>
                <div style="background:#F0F7FF;border-left:4px solid #3B82F6;padding:16px;border-radius:4px;margin:24px 0;">
                    <p style="margin:0;font-size:14px;color:#374151;"><strong>Email:</strong> ${email}</p>
                    <p style="margin:8px 0 0;font-size:14px;color:#374151;"><strong>Temporary Password:</strong> ${password}</p>
                </div>
                <p style="color:#EF4444;font-size:13px;">⚠️ You will be required to change your password on first login.</p>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Login to Portal</a>
                <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© 2025 IndusInnovate Technologies. All rights reserved.</p>
            </div>
        </div>`
    });
};

// ─── Send Password Reset Email ────────────────────────────────────
const sendPasswordResetEmail = async ({ to, name, resetLink }) => {
    await transporter.sendMail({
        from: FROM,
        to,
        subject: 'Password Reset Request – IndusInnovate Technologies',
        html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#1E3A8A,#3B82F6);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">IndusInnovate Technologies</h1>
            </div>
            <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
                <h2 style="color:#111827;">Password Reset</h2>
                <p style="color:#6B7280;">Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
                <a href="${resetLink}" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:24px 0;">Reset Password</a>
                <p style="color:#EF4444;font-size:13px;">⚠️ This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
                <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© 2025 IndusInnovate Technologies. All rights reserved.</p>
            </div>
        </div>`
    });
};

// ─── Send Leave Approval/Rejection Email ─────────────────────────
const sendLeaveStatusEmail = async ({ to, name, status, leaveType, fromDate, toDate, remarks }) => {
    const isApproved = status === 'Approved';
    await transporter.sendMail({
        from: FROM,
        to,
        subject: `Leave Request ${status} – IndusInnovate Technologies`,
        html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#1E3A8A,#3B82F6);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">IndusInnovate Technologies</h1>
            </div>
            <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
                <h2 style="color:${isApproved ? '#10B981' : '#EF4444'};">${isApproved ? '✅' : '❌'} Leave ${status}</h2>
                <p style="color:#6B7280;">Hi ${name}, your leave request has been <strong>${status.toLowerCase()}</strong>.</p>
                <div style="background:#F9FAFB;border:1px solid #E5E7EB;padding:16px;border-radius:8px;margin:24px 0;">
                    <p style="margin:0;font-size:14px;color:#374151;"><strong>Leave Type:</strong> ${leaveType}</p>
                    <p style="margin:8px 0 0;font-size:14px;color:#374151;"><strong>From:</strong> ${fromDate} &nbsp;<strong>To:</strong> ${toDate}</p>
                    ${remarks ? `<p style="margin:8px 0 0;font-size:14px;color:#374151;"><strong>Remarks:</strong> ${remarks}</p>` : ''}
                </div>
                <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© 2025 IndusInnovate Technologies. All rights reserved.</p>
            </div>
        </div>`
    });
};

// ─── Send Payslip Notification Email ────────────────────────────
const sendPayslipEmail = async ({ to, name, month, year, netSalary }) => {
    await transporter.sendMail({
        from: FROM,
        to,
        subject: `Your Payslip for ${month} ${year} – IndusInnovate Technologies`,
        html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#1E3A8A,#3B82F6);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">IndusInnovate Technologies</h1>
            </div>
            <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
                <h2 style="color:#111827;">💰 Payslip Ready</h2>
                <p style="color:#6B7280;">Hi ${name}, your payslip for <strong>${month} ${year}</strong> has been generated.</p>
                <div style="background:#EFF6FF;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                    <p style="color:#6B7280;font-size:13px;margin:0;">Net Take Home</p>
                    <p style="color:#1E40AF;font-size:32px;font-weight:700;margin:8px 0;">₹${Number(netSalary).toLocaleString('en-IN')}</p>
                </div>
                <p style="color:#6B7280;">Log in to the portal to view and download your detailed payslip.</p>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/employee/payslips" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">View Payslip</a>
                <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© 2025 IndusInnovate Technologies. All rights reserved.</p>
            </div>
        </div>`
    });
};

// ─── Send Meeting Invite Email ───────────────────────────────────
const sendMeetingInvite = async ({ to, name, title, scheduledAt, agenda, meetingLink }) => {
    await transporter.sendMail({
        from: FROM,
        to,
        subject: `Meeting Invite: ${title} – IndusInnovate Technologies`,
        html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#1E3A8A,#3B82F6);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">IndusInnovate Technologies</h1>
            </div>
            <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
                <h2 style="color:#111827;">📅 You're Invited</h2>
                <p style="color:#6B7280;">Hi ${name}, you have been invited to a meeting.</p>
                <div style="background:#F9FAFB;border:1px solid #E5E7EB;padding:16px;border-radius:8px;margin:24px 0;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">${title}</p>
                    <p style="margin:6px 0 0;font-size:14px;color:#374151;"><strong>When:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
                    ${agenda ? `<p style="margin:6px 0 0;font-size:14px;color:#374151;"><strong>Agenda:</strong> ${agenda}</p>` : ''}
                </div>
                ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;background:#10B981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Join Meeting</a>` : ''}
                <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© 2025 IndusInnovate Technologies. All rights reserved.</p>
            </div>
        </div>`
    });
};

// ─── Send Offer Letter Email ─────────────────────────────────────
const sendOfferLetterEmail = async ({ to, candidateName, role, department, joiningDate, type }) => {
    const isOffer = type === 'offer';
    await transporter.sendMail({
        from: FROM,
        to,
        subject: `${isOffer ? 'Offer Letter' : 'Joining Letter'} – IndusInnovate Technologies`,
        html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
            <div style="background:linear-gradient(135deg,#1E3A8A,#3B82F6);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">IndusInnovate Technologies</h1>
            </div>
            <div style="padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
                <h2 style="color:#111827;">🎉 ${isOffer ? 'Congratulations!' : 'Welcome to the Team!'}</h2>
                <p style="color:#6B7280;">Dear ${candidateName},</p>
                <p style="color:#6B7280;">We are pleased to extend ${isOffer ? 'an offer' : 'a joining letter'} for the position of <strong>${role}</strong> in the <strong>${department}</strong> department.</p>
                <div style="background:#F0FDF4;border-left:4px solid #10B981;padding:16px;border-radius:4px;margin:24px 0;">
                    <p style="margin:0;font-size:14px;color:#374151;"><strong>Joining Date:</strong> ${joiningDate}</p>
                </div>
                <p style="color:#6B7280;">Please find your ${isOffer ? 'offer letter' : 'joining letter'} attached. We look forward to having you on board.</p>
                <p style="color:#374151;margin-top:24px;">Warm Regards,<br><strong>HR Team</strong><br>IndusInnovate Technologies</p>
                <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">© 2025 IndusInnovate Technologies. All rights reserved.</p>
            </div>
        </div>`
    });
};

module.exports = {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendLeaveStatusEmail,
    sendPayslipEmail,
    sendMeetingInvite,
    sendOfferLetterEmail,
};
