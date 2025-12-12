"use server";

export async function doSocialLogin(formData) {
  const action = formData.get("action");
  // Return the redirect URL for client-side navigation
  return {
    redirect: `/api/auth/signin/${action}?callbackUrl=${encodeURIComponent(
      "/"
    )}`,
  };
}

export async function doLogout() {
  // Return signout URL
  return {
    redirect: "/api/auth/signout?callbackUrl=/",
  };
}

export async function doCredentialLogin(credentials) {
  try {
    // For credentials, we'll use the API route directly
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        redirect: "false",
        json: "true",
        csrfToken: "", // Will be handled by NextAuth
      }),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      return { success: true, url: data.url };
    } else {
      return {
        error: data.error || "Invalid credentials",
        success: false,
      };
    }
  } catch (err) {
    console.error("Login error:", err);
    return {
      error: "Authentication failed. Please try again.",
      success: false,
    };
  }
}
