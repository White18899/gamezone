import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, ArrowRight, Play } from 'lucide-react';

export default function Login({ onLoginSuccess, onSendEmailOtp, googleClientId }) {
  // Common states
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Email OTP states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Google OAuth Token Client State
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    if (!googleClientId) return;

    const initializeGoogleOAuth = () => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'openid profile email',
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                setIsSending(true);
                setError('');
                try {
                  // Fetch profile details from Google API using the access token
                  const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
                  if (res.ok) {
                    const userInfo = await res.json();
                    onLoginSuccess({
                      name: userInfo.name || userInfo.given_name,
                      email: userInfo.email,
                      avatar: userInfo.picture,
                      accessToken: tokenResponse.access_token
                    });
                  } else {
                    setError('FAILED TO RETRIEVE GOOGLE USER DETAILS');
                  }
                } catch {
                  setError('CONNECTION ERROR RETRIEVING GOOGLE PROFILE');
                } finally {
                  setIsSending(false);
                }
              }
            }
          });
          setTokenClient(client);
        } catch (e) {
          console.error('Google OAuth initialization failed:', e);
        }
      } else {
        setTimeout(initializeGoogleOAuth, 500);
      }
    };

    initializeGoogleOAuth();
  }, [googleClientId, onLoginSuccess]);

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
    if (tokenClient) {
      try {
        tokenClient.requestAccessToken();
      } catch (err) {
        console.error('Google Sign-In trigger failed:', err);
        triggerMockGoogleLogin();
      }
    } else {
      triggerMockGoogleLogin();
    }
  };

  const triggerMockGoogleLogin = () => {
    setIsSending(true);
    setError('');
    setTimeout(() => {
      setIsSending(false);
      onLoginSuccess({ 
        name: 'Arena Guest (via Google)', 
        email: 'guest@void.gz',
        accessToken: 'mock_access_token_12345'
      });
    }, 800);
  };

  return (
    <div className="overlay-container">
      <div className="login-card glass border-glow animate-fade-in" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
                  placeholder="player@void.gz"
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

            <button 
              type="button" 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', width: '100%' }}
              onClick={handleGoogleLogin}
              disabled={isSending}
            >
              Sign in with Google
            </button>
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




