"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./LoginPage.css";


  const LoginPage = () => {
const router = useRouter();
const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  try {

    await login(email, password);

    router.push("/dashboard");

  } catch (err: any) {

    setError(err?.message || "Login failed");

  } finally {

    setLoading(false);

  }
};

  return (
    <div className="login-container">
      {/* Left Side: Branding & Info */}
      <section className="info-section">
        <header className="logo">GrowMarkt</header>
        
        <div className="hero-content">
          <h1>Elevate your data to <br /><span>editorial precision.</span></h1>
          <p className="description">
            Unlock high-fidelity social intelligence designed for executive decision-making. 
            Move beyond basic tracking into the realm of curated, actionable data precision.
          </p>

          <div className="feature-item">
<div className="icon-box dark">
   <img src="/assets/spectral.png" alt="Spectral" className="feature-img" /> 
  </div>
  <div className="feature-text">
    <h3>Spectral Clustering</h3>
    <p>Refining digital footprints through advanced algorithmic precision.</p>
  </div>
</div>

<div className="feature-item">
  <div className="icon-box green">
    <img src="/assets/dimension.png" alt="Dimension" className="feature-img" />
  </div>
  <div className="feature-text">
    <h3>Dimensional Analysis</h3>
    <p>Deep-tier performance tracking across multi-faceted digital ecosystems.</p>
  </div>
</div>

          <div className="testimonial-card">
  <p>
    "The interface has fundamentally transformed our reporting culture,
    providing the clarity needed for global strategy."
  </p>

  <div className="author">
    <div className="avatar">
      <img src="/assets/chief.jpg" alt="Marcus Thorne" className="avatar-img" />
    </div>

    <div>
      <strong>Marcus Thorne</strong>
      <span>CHIEF STRATEGY OFFICER, NEXUS GLOBAL</span>
    </div>
  </div>
</div>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="form-section">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Log in to your editorial dashboard.</p>

{error && (
  <div className="error-message">
    {error}
  </div>
)}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>EMAIL ADDRESS</label>
<input
  type="email"
  placeholder="curator@growmarkt.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>PASSWORD</label>
                <Link href="/reset-password" className="forgot-password">
  Forgot password?
</Link>
              </div>
<input
  type="password"
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="keep-logged" />
              <label htmlFor="keep-logged">Keep me logged in</label>
            </div>

<button
  type="submit"
  className="sign-in-btn"
  disabled={loading}
>
  {loading ? "Signing In..." : "SIGN IN"}
</button>
          </form>

          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>

<div className="social-login">
  <button type="button" className="social-btn">
    <img src="/assets/google.png" alt="Google" className="social-icon" />
    GOOGLE
  </button>

  <button type="button" className="social-btn">
    <img src="/assets/linkedin.png" alt="LinkedIn" className="social-icon" />
    LINKEDIN
  </button>
</div>
<p className="signup-link">
  New to GrowMarkt?{" "}
  <Link href="/register">Create an account</Link>
</p>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="page-footer">
        <div className="footer-left">
          <strong>GrowMarkt</strong> <span className="footer-text">
  © 2024 GROWMARKT INC. EDITORIAL PRECISION IN DATA.
</span>
        </div>
        <div className="footer-links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
          <a href="#">SECURITY</a>
          <a href="#">HELP CENTER</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;