import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA token is missing' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY is not configured in server environment.');
      // If secret key is not set in dev, allow passage with a warning or fail depending on security
      return NextResponse.json({ success: true, bypassed: true });
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(
      secretKey
    )}&response=${encodeURIComponent(token)}`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    // reCAPTCHA v3 returns: { success: true/false, score: 0.0 - 1.0, action: string, ... }
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return NextResponse.json(
        { success: false, error: 'reCAPTCHA verification failed', details: data['error-codes'] },
        { status: 403 }
      );
    }

    // Google recommends score >= 0.5 for legitimate human interactions
    if (typeof data.score === 'number' && data.score < 0.5) {
      return NextResponse.json(
        { success: false, error: 'Bot detected (low risk score)', score: data.score },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      score: data.score,
      action: data.action,
    });
  } catch (error: any) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying reCAPTCHA' },
      { status: 500 }
    );
  }
}
