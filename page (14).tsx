// src/app/api/reset-admin-password/route.ts
// Called by the Super Admin dashboard to update a school admin's Firebase Auth password.
// Requires FIREBASE_SERVICE_ACCOUNT_JSON or individual env vars for Admin SDK init.

import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth }                       from "firebase-admin/auth";
import { getFirestore, FieldValue }      from "firebase-admin/firestore";

// ── Firebase Admin init (singleton) ──────────────────────────
function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : {
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      };
  return initializeApp({ credential: cert(serviceAccount) });
}

// ── POST /api/reset-admin-password ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { schoolId } = await req.json();
    if (!schoolId) {
      return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
    }

    const app   = getAdminApp();
    const auth  = getAuth(app);
    const db    = getFirestore(app);

    // 1. Read school document
    const schoolRef  = db.collection("schools").doc(schoolId);
    const schoolSnap = await schoolRef.get();
    if (!schoolSnap.exists) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const school      = schoolSnap.data()!;
    const pendingPwd  = school.pendingPasswordReset as string | undefined;
    const adminUid    = school.adminUid as string | undefined;

    if (!pendingPwd) {
      return NextResponse.json({ error: "No pending password reset for this school" }, { status: 400 });
    }
    if (!adminUid) {
      return NextResponse.json({ error: "No adminUid stored for this school — cannot reset password" }, { status: 400 });
    }

    // 2. Update Firebase Auth password
    await auth.updateUser(adminUid, { password: pendingPwd });

    // 3. Clear the pending reset field from Firestore
    await schoolRef.update({
      pendingPasswordReset: FieldValue.delete(),
      mustChangePassword:   true,  // keep true so app still prompts
      passwordResetApplied: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    console.error("[reset-admin-password]", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
