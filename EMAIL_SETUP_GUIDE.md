# Email Setup Guide for DigiDiary

This guide explains how to set up email functionality for password recovery in DigiDiary, supporting both Gmail and BRAC University email addresses.

## How Password Recovery Works

### Step-by-Step Process:

1. **User requests password reset** → Enters email address on forgot password page
2. **Server generates unique token** → Creates a secure, time-limited reset token (10 minutes)
3. **Server sends email** → Uses Nodemailer to send beautiful HTML email with reset link
4. **User clicks link** → Goes to reset password page with token in URL
5. **Server verifies token** → Checks if token is valid and not expired
6. **User sets new password** → Password is updated in database and user is logged in

### Email Features:
- ✅ Beautiful HTML email templates
- ✅ Automatic detection of email provider (Gmail vs BRAC University)
- ✅ Secure token generation and verification
- ✅ 10-minute expiration for security
- ✅ One-time use tokens
- ✅ Professional branding with DigiDiary logo

## Setup Instructions

### 1. Gmail Setup

#### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click on "Security"
3. Enable "2-Step Verification"

#### Step 2: Generate App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer" (or your device)
3. Click "Generate"
4. Copy the 16-character app password

#### Step 3: Update .env file
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### 2. BRAC University Email Setup

#### Step 1: Access BRAC University Email
1. Go to [mail.google.com](https://mail.google.com)
2. Sign in with your `@g.bracu.ac.bd` email
3. If you haven't set up your BRAC email yet, contact IT department

#### Step 2: Enable 2-Factor Authentication (if available)
1. Follow the same steps as Gmail setup
2. Generate an app password for your BRAC email

#### Step 3: Update .env file
```env
BRACU_EMAIL_USER=your-email@g.bracu.ac.bd
BRACU_EMAIL_PASS=your-bracu-app-password
```

### 3. Complete .env Configuration

Here's your complete `.env` file configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/digidiary

# JWT Configuration
JWT_SECRET=digidiary-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRE=7d

# Email Configuration - Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password

# Email Configuration - BRAC University
BRACU_EMAIL_USER=your-email@g.bracu.ac.bd
BRACU_EMAIL_PASS=your-bracu-app-password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

## Testing Email Functionality

### Test Password Reset

1. First, register a new user account
2. Go to the login page
3. Click "Forgot Password?"
4. Enter your registered email address
5. Check your email for the reset link
6. Click the link and set a new password

## Email Templates

The system automatically sends beautiful HTML emails with:

- **DigiDiary branding** with gradient header
- **Clear instructions** for password reset
- **Security warnings** about link expiration
- **Professional styling** with responsive design
- **Fallback text** for email clients that don't support HTML

## Troubleshooting

### Common Issues:

1. **"Email could not be sent" error**
   - Check if 2-factor authentication is enabled
   - Verify app password is correct
   - Ensure email and password are in .env file

2. **"Invalid credentials" when using app password**
   - Make sure you're using the 16-character app password, not your regular password
   - Regenerate the app password if needed

3. **BRAC University email not working**
   - Contact BRAC IT department to ensure email is properly configured
   - Check if SMTP access is enabled for your account

4. **Token expired error**
   - Tokens expire after 10 minutes for security
   - Request a new password reset

### Security Notes:

- ✅ App passwords are more secure than regular passwords
- ✅ Tokens expire after 10 minutes
- ✅ Each token can only be used once
- ✅ Email addresses are validated before sending
- ✅ Reset links are cryptographically secure

## Database Status

✅ **Database cleared and ready for real users!**
- No demo data - users will create their own accounts and journals
- Ready for production use

You can now test the complete application with real user registration! 