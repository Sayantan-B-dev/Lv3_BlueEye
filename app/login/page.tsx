"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLoading } from "@/lib/context/LoadingContext";
import { siteConfig } from "@/lib/config/site";

type View = "login" | "register" | "verify" | "forgot-password" | "reset-password";

function LoginPageContent() {
  const router = useRouter();
  const { setIsLoading } = useLoading();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [view, setView] = useState<View>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    code: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);
    // Note: We don't setIsLoading(false) here if successful because router.push will handle it via NavigationListener
    // But if there's an error, we MUST reset it.

    if (result?.error) {
      setIsLoading(false);
      if (result.error === "Email not verified") {
        setView("verify");
        setError("Please verify your email first.");
      } else {
        setError("Invalid credentials.");
      }
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccess("Verification code sent to your email!");
      setView("verify");
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          code: formData.code
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccess("Email verified! You can now login.");
      setView("login");
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccess("OTP sent to your email!");
      setView("reset-password");
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ 
          email: formData.email,
          token: formData.code, // Reusing 'code' field for OTP
          password: formData.password 
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccess("Password reset successful! You can now login.");
      setView("login");
      setFormData({ ...formData, password: "", code: "" });
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section-inner" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--hdr-h) 1rem' }}>
      <div style={{ width: '100%', maxWidth: '450px', background: 'var(--surface)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: '0.5rem' }}>
            {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Create Account' : view === 'forgot-password' ? 'Reset Password' : view === 'reset-password' ? 'Set New Password' : 'Verify Email'}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>
            {view === 'login' ? 'Enter your credentials to continue' : view === 'register' ? 'Join India\'s premium artist platform' : view === 'forgot-password' ? 'Enter your email to receive an OTP' : view === 'reset-password' ? 'Enter the OTP sent to your email and your new password' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(255,107,107,0.2)' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(76,201,240,0.1)', color: '#4cc9f0', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(76,201,240,0.2)' }}>{success}</div>}

        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="••••••••" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', paddingRight: '2.5rem', borderRadius: '12px', color: '#fff', outline: 'none' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
            
            <div style={{ textAlign: 'right' }}>
              <button type="button" onClick={() => setView('forgot-password')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '0.85rem', cursor: 'pointer' }}>
                Forgot Password?
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <button type="button" onClick={() => signIn('google', { callbackUrl })} className="btn-outline" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', justifyContent: 'center', display: 'flex', gap: '0.5rem' }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text2)' }}>
              Don't have an account? <button type="button" onClick={() => setView('register')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Create one</button>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="johndoe123" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="Min 6 characters" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', paddingRight: '2.5rem', borderRadius: '12px', color: '#fff', outline: 'none' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text2)' }}>
              Already have an account? <button type="button" onClick={() => setView('login')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign In</button>
            </p>
          </form>
        )}

        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text2)' }}>
              Remember your password? <button type="button" onClick={() => setView('login')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign In</button>
            </p>
          </form>
        )}

        {view === 'reset-password' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>6-Digit OTP</label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="123456" maxLength={6} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#d4a017', outline: 'none', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  placeholder="Min 6 characters" 
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.75rem 1rem', paddingRight: '2.5rem', borderRadius: '12px', color: '#fff', outline: 'none' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text2)' }}>
              Back to <button type="button" onClick={() => setView('login')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign In</button>
            </p>
          </form>
        )}

        {view === 'verify' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text2)' }}>6-Digit Code</label>
              <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="123456" maxLength={6} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '12px', color: '#d4a017', outline: 'none', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', justifyContent: 'center', marginTop: '0.5rem' }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text2)' }}>
              Didn't receive code? <button type="button" onClick={handleRegister} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Resend</button>
            </p>
          </form>
        )}

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
