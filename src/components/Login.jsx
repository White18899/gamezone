import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, ArrowRight, Play } from 'lucide-react';

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export default function Login({ onLoginSuccess, onSendEmailOtp, googleClientId }) {
  // Common states
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Email OTP states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP
  const [generatedOtp, setGeneratedOtp] = useState('');

  useEffect(() => {
    if (step !== 1) return;
    if (!googleClientId) return;

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              const decoded = decodeJwt(response.credential);
              if (decoded) {
                onLoginSuccess({
                  name: decoded.name || decoded.given_name,
                  email: decoded.email,
                  avatar: decoded.picture
                });
              }
            }
          });
          
          const btnContainer = document.getElementById('google-signin-btn-container');
          if (btnContainer) {
            window.google.accounts.id.renderButton(
              btnContainer,
              { 
                theme: 'filled_black', 
                size: 'large', 
                type: 'standard', 
                shape: 'rectangular',
                text: 'signin_with', 
                width: 376 
              }
            );
          }
        } catch (e) {
          console.error('Google Sign-In initialization failed:', e);
        }
      } else {
        setTimeout(initializeGoogleSignIn, 500);
      }
    };

    initializeGoogleSignIn();
  }, [googleClientId, step, onLoginSuccess]);

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSending(true);
    setError('');
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      const res = await onSendEmailOtp(email, code);
      if (res && res.success) {
        setGeneratedOtp(code);
        setStep(2);
      } else {
        const errMsg = res ? res.error : 'Failed to send OTP';
        setError(`TRANSMISSION ERROR: ${errMsg}. [Dev Mode Code: ${code}]`);
      }
    } catch (err) {
      setError(`NETWORK ERROR: ${err.message || 'Connection failed'}. [Dev Mode Code: ${code}]`);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyEmailOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp || otp === '0000') {
      const username = email.split('@')[0];
      const displayName = username.charAt(0).toUpperCase() + username.slice(1);
      onLoginSuccess({ name: displayName, email });
    } else {
      setError('AUTHENTICATION FAILED: INVALID OTP CODE');
    }
  };

  const handleGoogleLogin = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onLoginSuccess({ name: 'Nithin (via Google)', email: 'nithin@void.gz' });
    }, 800);
  };

  return (
    <div className="overlay-container">
      <div className="login-card glass border-glow animate-fade-in" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        <div className="login-logo" style={{ marginBottom: '2rem' }}>
          VOID<span className="logo-dot"></span>GZ
        </div>
        
        {step === 1 ? (
          <div>
            <form onSubmit={handleSendEmailOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">
                  <Mail size={10} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} /> Email Address
                </label>
                <input
                  id="email-input"
                  type="email"
                  className="form-input"
                  placeholder="nithin@void.gz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="mono animate-fade-in" style={{ color: '#ff3b30', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                  [Error]: {error}
                </p>
              )}

              <button type="submit" className="btn-primary mt-2" disabled={isSending}>
                {isSending ? 'Sending OTP...' : 'Send OTP Code'} <ArrowRight size={14} />
              </button>
            </form>

            <div className="login-divider" style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
              <span style={{ padding: '0 1rem' }}>OR</span>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
            </div>

            {googleClientId ? (
              <div id="google-signin-btn-container" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
            ) : (
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', width: '100%' }}
                onClick={handleGoogleLogin}
                disabled={isSending}
              >
                Sign in with Google
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleVerifyEmailOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otp-input">
                <ShieldCheck size={10} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} /> OTP Verification
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength="4"
                className="form-input mono-input"
                style={{ textAlign: 'center', fontSize: '1.75rem', letterSpacing: '0.4em' }}
                placeholder="••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
              <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.75rem', textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Enter code or use '0000' developer bypass.
              </p>
            </div>

            {error && (
              <p className="mono animate-fade-in" style={{ color: '#ff3b30', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', textAlign: 'center' }}>
                [Error]: {error}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button type="submit" className="btn-primary">
                Verify Credentials <Play size={10} fill="currentColor" />
              </button>
              
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
              >
                Return to Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}



