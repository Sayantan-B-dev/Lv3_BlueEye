type TurnstileResult = {
  ok: boolean;
  skipped?: boolean;
  errors?: string[];
};

let warnedMissingSecret = false;

export async function verifyTurnstile(
  token: unknown,
  ip?: string | null
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn("[Turnstile] TURNSTILE_SECRET_KEY is not set; skipping verification.");
      warnedMissingSecret = true;
    }
    return { ok: true, skipped: true };
  }

  if (typeof token !== "string" || !token) {
    return { ok: false, errors: ["missing-input-response"] };
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      return { ok: false, errors: [`siteverify-${res.status}`] };
    }

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    return { ok: data.success === true, errors: data["error-codes"] };
  } catch (err) {
    console.error("[Turnstile] Verification failed:", err);
    return { ok: false, errors: ["verification-failed"] };
  }
}
