// src/app/api/reset-admin-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK if not already done
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const auth = getAuth();

export async function POST(request: NextRequest) {
  try {
    const { email, tempPassword } = await request.json();

    if (!email || !tempPassword) {
      return NextResponse.json(
        { message: "Email and temporary password are required" },
        { status: 400 }
      );
    }

    // Get the user by email
    const user = await auth.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Update the user's password
    await auth.updateUser(user.uid, {
      password: tempPassword,
    });

    // Set custom claims to force password change on next login
    await auth.setCustomUserClaims(user.uid, {
      mustChangePassword: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully",
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset error:", error);

    let errorMessage = "Failed to reset password";
    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (error.code === "auth/invalid-password") {
      errorMessage = "Invalid password format";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    }

    return NextResponse.json(
      { message: errorMessage, error: error.message },
      { status: 500 }
    );
  }
}
