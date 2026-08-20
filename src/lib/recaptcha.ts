/**
 * Google reCAPTCHA v3 client-side verification utility
 * Runs in browser, calls window.grecaptcha to get a token,
 * then validates it against the minimum score threshold.
 *
 * NOTE: Full server-side verification requires a server API route
 * that calls https://www.google.com/recaptcha/api/siteverify
 * For now, this is a graceful no-op when reCAPTCHA is not configured.
 */

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export async function verifyRecaptcha(action: string): Promise<boolean> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // If reCAPTCHA is not configured, silently allow (development mode)
  if (!siteKey) {
    return true;
  }

  // Check if grecaptcha is loaded
  if (typeof window === 'undefined' || !window.grecaptcha) {
    console.warn('reCAPTCHA not loaded. Allowing request.');
    return true;
  }

  try {
    const token = await new Promise<string>((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          const t = await window.grecaptcha.execute(siteKey, { action });
          resolve(t);
        } catch (err) {
          reject(err);
        }
      });
    });

    if (!token) {
      return false;
    }

    // Server-side verification via /api/verify-recaptcha
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, action }),
    });

    if (!response.ok) {
      console.warn('reCAPTCHA backend returned non-200 status:', response.status);
      return true; // Fail open to not block legitimate users on minor API hiccups
    }

    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    // Fail open (allow) so legitimate users aren't blocked on network error
    return true;
  }
}
