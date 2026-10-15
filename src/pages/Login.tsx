import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

type Step = "credentials" | "otp";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 4;

// Eye icons as inline SVGs
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyOtp, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const isOtpComplete = otpDigits.every((d) => d !== "");
  const otpString = otpDigits.join("");

  function handleOtpDigitChange(index: number, value: string) {
    // Take the last typed character (handles paste-into-single-box too)
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
      otpRefs.current[index + 1]?.select();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      e.preventDefault();
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      otpRefs.current[index - 1]?.focus();
    }
    else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    setOtpDigits(() => {
      const next = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      return next;
    });
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  }

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Start countdown when entering OTP step
  const startResendCountdown = useCallback(() => {
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
  }, []);

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Arafine Admin</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render login form if authenticated (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      setStep("otp");
      startResendCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isOtpComplete) return;
    setIsLoading(true);

    try {
      await verifyOtp(email, otpString);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setIsResending(true);

    try {
      await login(email, password);
      startResendCountdown();
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  }

  function handleBackToCredentials() {
    setStep("credentials");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    setResendCountdown(0);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Arafine Admin</h1>
          <p>{step === "credentials" ? "Sign in to your account" : "Enter OTP sent to your email"}</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@arafine.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="login-form">
            <div className="form-group">
              <label>OTP Code</label>
              <div className="otp-input-group" role="group" aria-label={`${OTP_LENGTH}-digit OTP code`}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    className="otp-digit"
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    maxLength={1}
                    required
                    autoFocus={index === 0}
                    disabled={isLoading}
                    aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  />
                ))}
              </div>
              <p className="otp-hint">Check your email ({email}) for the OTP</p>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || !isOtpComplete}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="resend-otp-section">
              {resendCountdown > 0 ? (
                <p className="resend-countdown">
                  Resend OTP in <span>{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            <button type="button" className="back-button" onClick={handleBackToCredentials}>
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
