# Environment Variables Setup Guide

## 📋 Overview
These environment variables are needed for the password reset functionality to work in the super admin dashboard.

## 🔧 How to Configure

### Step 1: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **vidyalayam-288fd**
3. Click **⚙️ Settings** (gear icon) → **Project settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key** button
6. A JSON file will download - keep it safe!

### Step 2: Extract Credentials from JSON

Open the downloaded JSON file and find:
- `"project_id"` → Copy this value
- `"client_email"` → Copy this value  
- `"private_key"` → Copy this value (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts)

### Step 3: Update `.env.local`

Open `.env.local` in the project root and replace:

```env
FIREBASE_PROJECT_ID=vidyalayam-288fd
FIREBASE_CLIENT_EMAIL=your-service-account-email@vidyalayam-288fd.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-private-key-here\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_API_URL=http://localhost:5000
```

⚠️ **Important:** 
- Keep newlines in the private key as `\n` (they might already be this way in the JSON)
- Never commit `.env.local` to Git (it's in `.gitignore`)
- Keep the value wrapped in quotes

### Example (DO NOT USE - for reference only):
```env
FIREBASE_PROJECT_ID=vidyalayam-288fd
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@vidyalayam-288fd.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## ✅ Verify Setup

After updating `.env.local`:

1. **Restart your dev server** (`npm run dev`)
2. **Test password reset:**
   - Go to Schools Management
   - Click "🔑 Reset Pass" on any school
   - Should work without errors

## 🚀 For Deployment (Vercel/Production)

1. Go to Vercel Project Settings → **Environment Variables**
2. Add the same variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
3. Redeploy

## 🔐 Security Notes

- ⚠️ **Never** share your private key
- ⚠️ **Never** commit `.env.local` to Git
- ⚠️ Rotate your API keys regularly in Firebase Console
- ✅ Use `.env.local` for development only
- ✅ Use Vercel/production environment variables for deployment

## 🆘 Troubleshooting

**Error: "User not found"**
- The admin email doesn't exist in Firebase Auth
- Check the email spelling in your database

**Error: "FIREBASE_PRIVATE_KEY is required"**
- The environment variable is not set
- Restart your dev server: `npm run dev`

**Error: "Invalid private key format"**
- Make sure the private key has `\n` for newlines
- Check that the key starts with `-----BEGIN PRIVATE KEY-----`

## 📚 Related Files

- `.env.local` - Your local configuration (DO NOT COMMIT)
- `.env.example` - Template for all required variables
- `src/app/api/reset-admin-password/route.ts` - Password reset endpoint
