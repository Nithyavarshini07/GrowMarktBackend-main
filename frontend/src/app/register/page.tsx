"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import "./InitializeAccount.css";

const InitializeAccount = () => {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please provide your name, email, and password.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="init-container">

      {/* LEFT SECTION */}
      <div className="init-left">
        <header className="init-logo">GrowMarkt</header>

        <div className="init-hero-content">
          <h1 className="init-title">
            Elevate your data to <br />
            <span>editorial precision.</span>
          </h1>

          <p className="init-desc">
            Unlock high-fidelity social intelligence designed for executive
            decision-making. Move beyond basic tracking into the realm of
            curated, actionable data precision.
          </p>

          <div className="init-features">
            <div className="init-feature">
              <div className="init-icon init-dark">hub</div>
              <div>
                <h3>Spectral Clustering</h3>
                <p>
                  Refining digital footprints through advanced algorithmic
                  precision.
                </p>
              </div>
            </div>

            <div className="init-feature">
              <div className="init-icon init-green">layers</div>
              <div>
                <h4>Dimensional Analysis</h4>
                <p>
                  Deep-tier performance tracking across multi-faceted digital
                  ecosystems.
                </p>
              </div>
            </div>
          </div>

          <div className="init-testimonial">
            <p>
              "The interface has fundamentally transformed our reporting
              culture, providing the clarity needed for global strategy."
            </p>

            <div className="init-user">
              <div className="init-avatar">
                <img
                  src="/assets/chief.jpg"
                  alt="Marcus Thorne"
                  className="init-avatar-img"
                />
              </div>

              <div>
                <strong>Marcus Thorne</strong>
            
                <span>CHIEF STRATEGY OFFICER, NEXUS GLOBAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="init-right">
        <div className="init-card">
          <h2>Initialize Account</h2>
          <p className="init-trial">Start your 14-day editorial trial.</p>

          {error && (
            <div className="init-error-message">{error}</div>
          )}

          <form onSubmit={handleCreateAccount} className="init-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
              required
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              type="email"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <label className="init-checkbox">
              <input type="checkbox" required />
              <span className="init-checkmark"></span>
              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            <button className="init-btn" type="submit" disabled={loading}>
              {loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
            </button>
          </form>

          <p className="init-or">OR SIGN UP WITH</p>

          <div className="init-social-login">
            <button type="button" className="init-social-btn">
              <img
                src="/assets/google.png"
                alt="Google"
                className="init-social-icon"
              />
              GOOGLE
            </button>

            <button type="button" className="init-social-btn">
              <img
                src="/assets/linkedin.png"
                alt="LinkedIn"
                className="init-social-icon"
              />
              LINKEDIN
            </button>
          </div>

          <p className="init-login">
            Already part of the network?{" "}
            <span onClick={() => (router.push("/login"))}>
              Log in
            </span>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="init-page-footer">
        <div className="init-footer-left">
          <strong>GrowMarkt</strong>
          <span className="init-footer-text">
            © 2024 GROWMARKT INC. EDITORIAL PRECISION IN DATA.
          </span>
        </div>

        <div className="init-footer-links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
          <a href="#">SECURITY</a>
          <a href="#">HELP CENTER</a>
        </div>
      </footer>

    </div>
  );
};

export default InitializeAccount;