# 🧪 Testing Guide: School Management Features

## ✅ Pre-Test Checklist

- [ ] Firebase credentials added to `.env.local`
- [ ] Dev server restarted: `npm run dev`
- [ ] Dev server running on `http://localhost:3000`
- [ ] Logged in as Super Admin

---

## 📋 Test 1: Create New School with Temporary Password

### Steps:
1. Go to **Schools Management** page
2. Click **"＋ Onboard School"** button (gold)
3. Fill in the form:
   - **School Name:** Test School 2026
   - **Village/City:** Bangalore
   - **District:** Bengaluru
   - **State:** Karnataka
   - **Admin Name:** John Doe
   - **Admin Email:** testschool@vidyalayam.edu.in
   - **Admin Phone:** +91 9876543210

### Expected Results:
- ✅ **School Code Generated:** Should appear (e.g., `TS-BEN` or similar)
- ✅ **Form validation:** All required fields show warnings if empty
- ✅ **Can proceed to Branding tab**

### Continue:
4. Click **"Next → Set Branding 🎨"**
5. (Optional) Upload logo or pick color
6. Click **"Skip & Onboard ✓"** OR **"Next → WhatsApp 💬"**

### Expected Results When School Created:
- ✅ **Credentials Modal appears** with:
  - School Code
  - Login Email: testschool@vidyalayam.edu.in
  - **Temporary Password** (format: `VL@TS-BEN2026#XX`)
  - "Copy All Credentials" button works
  
- ✅ **Click "✓ Done — Show QR Code →"**
- ✅ **QR Modal shows:**
  - QR code to scan
  - School name/logo
  - Success message

### ✅ Test Passed If:
- School appears in the schools table
- Status shows **Active** ✅
- Temporary password is unique and valid format

---

## 🔑 Test 2: Reset Admin Password

### Steps:
1. Go to **Schools Management** page
2. Find the school you just created in the table
3. Click **"🔑 Reset Pass"** button

### Expected Results:
- ✅ **Modal Opens:** "🔑 Reset Admin Password"
- ✅ **Shows:**
  - School Name: Test School 2026
  - Admin Email: testschool@vidyalayam.edu.in
  - Warning message
- ✅ **Click "✓ Generate New Password"**

### After Button Clicked:
- ✅ **Loading state:** Button shows "Generating…"
- ✅ **Success:** Alert appears: "✅ Password reset successful!"
- ✅ **Modal closes** automatically

### ✅ Test Passed If:
- No error messages appear
- Alert confirms success
- Admin can login with new password (test in another browser/incognito)

---

## 🚫 Test 3: Disable/Enable School

### Steps:
1. Go to **Schools Management** page
2. Find a school in the table
3. Click **"🚫 Disable"** button (red)

### Expected Results:
- ✅ **Status changes immediately** 
- ✅ **Dashboard updates:**
  - Active count decreases by 1
  - Disabled count increases by 1
- ✅ **Badge changes** from ✅ to 🚫

### Re-Enable:
4. Click **"✓ Enable"** button (now green)

### Expected Results:
- ✅ **Status changes back to Active**
- ✅ **Dashboard updates again**
- ✅ **Badge shows** ✅ again

### ✅ Test Passed If:
- Status toggles smoothly
- Dashboard metrics update in real-time
- Badge and button text change correctly

---

## 🐛 Troubleshooting

### Issue: "Password reset failed" Error

**Cause:** Firebase credentials not loaded properly

**Fix:**
1. Check `.env.local` has correct values
2. Restart dev server: `npm run dev`
3. Check browser console (F12) for errors

### Issue: School doesn't appear in table after creation

**Cause:** Firestore database synchronization delay

**Fix:**
1. Refresh the page (F5)
2. Check Firestore Console → schools collection
3. Verify document was created

### Issue: Temporary password looks wrong (e.g., "VL@undefined")

**Cause:** School code not generated properly

**Fix:**
1. Clear form and try again with different school name/village
2. Check browser console for errors

### Issue: "Can't modify status" Error

**Cause:** Firestore permissions issue

**Fix:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Firestore Database → Rules
3. Verify your user has write permissions to "schools" collection

---

## 📊 Summary Validation

After all tests, your dashboard should show:

| Metric | Expected |
|--------|----------|
| Total Schools | ≥ 1 |
| Active | ≥ 1 |
| Disabled | ≥ 0 |
| WhatsApp Active | ≥ 0 |

---

## ✨ Features Summary

| Feature | Status | Test Result |
|---------|--------|-------------|
| Temporary password on onboard | ✅ | [ ] Pass / [ ] Fail |
| Reset password button | ✅ | [ ] Pass / [ ] Fail |
| Generate new password works | ✅ | [ ] Pass / [ ] Fail |
| Disable/Enable schools | ✅ | [ ] Pass / [ ] Fail |
| Status updates in real-time | ✅ | [ ] Pass / [ ] Fail |

---

## 🎯 Next Steps After Testing

- [ ] Test works in Incognito (browser cache)
- [ ] Test on mobile browser
- [ ] Check Firestore for saved data
- [ ] Try resetting another school's password
- [ ] Deploy to Vercel and test in production

---

## 📞 Need Help?

If any test fails:
1. Check browser console: **F12**
2. Check browser network tab for API errors
3. Check Firebase Console for auth/database issues
4. Share error messages and I'll help debug!
