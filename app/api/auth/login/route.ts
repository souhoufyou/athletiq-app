import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // TODO: Implement actual authentication (Supabase, Auth0, etc.)
    // For now, this is a placeholder that accepts any credentials
    const response = NextResponse.json(
      { message: "Authentication successful" },
      { status: 200 }
    );

    response.cookies.set("auth", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Authentication failed" },
      { status: 500 }
    );
  }
}
