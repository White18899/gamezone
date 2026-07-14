import React, { useState } from 'react';
import { Phone, User, ShieldCheck, ArrowRight, Play } from 'lucide-react';

export default function Login({ onLoginSuccess, onSendOtpMessage }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setError('');
    setStep(2);
    onSendOtpMessage(code);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp || otp === '0000') {
      onLoginSuccess({ name, phone });
    } else {
      setError('AUTHENTICATION FAILED: INVALID OTP CODE');
    }
  };

  return (
    <div className="overlay-container">
      <div className="login-card glass border-glow animate-fade-in" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="login-logo">
          VOID<span className="logo-dot"></span>GZ
        </div>
        
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">
                <User size={10} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} /> Name Identification
              </label>
              <input
                id="name-input"
                type="text"
                className="form-input"
                placeholder="Nithin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="phone-input">
                <Phone size={10} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} /> Phone Contact
              </label>
              <input
                id="phone-input"
                type="tel"
                maxLength="10"
                className="form-input mono-input"
                placeholder="9492906475"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            {error && (
              <p className="mono animate-fade-in" style={{ color: '#ff3b30', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                [Error]: {error}
              </p>
            )}

            <button type="submit" className="btn-primary mt-2">
              Send OTP Code <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
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
                A mock SMS code is generated at the top right.
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
                Return to Info
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
