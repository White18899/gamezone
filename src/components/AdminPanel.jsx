import React, { useState } from 'react';
import { X, Key, Eye, EyeOff } from 'lucide-react';

export default function AdminPanel({ settings, onUpdateSettings, emailGatewaySettings, onUpdateEmailSettings, onSendEmailOtp, googleClientId, onUpdateGoogleClientId, adminAccessToken, onUpdateAdminAccessToken, user, bookings, onClose, onClearBookings, onEndActiveSession, activeBooking }) {
  const [pin, setPin] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Auto unlock if currently logged in user's token matches admin access token
    return !!(user && user.accessToken && user.accessToken === adminAccessToken);
  });
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  
  const [minTime, setMinTime] = useState(settings.minTime || 30);
  const [pricePerHalfHour, setPricePerHalfHour] = useState(settings.pricePerHalfHour || 50);
  const [stationName, setStationName] = useState(settings.stationName || 'PlayStation 5 Console #1');
  const [stationStatus, setStationStatus] = useState(settings.stationStatus || 'online');

  const [activeTab, setActiveTab] = useState('settings');

  // Email Gateway States
  const [emailGateway, setEmailGateway] = useState(emailGatewaySettings?.gateway || 'mock');
  const [emailjsServiceId, setEmailjsServiceId] = useState(emailGatewaySettings?.emailjsServiceId || '');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState(emailGatewaySettings?.emailjsTemplateId || '');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState(emailGatewaySettings?.emailjsPublicKey || '');

  const [testEmail, setTestEmail] = useState('nithin@void.gz');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  const [gClientId, setGClientId] = useState(googleClientId || '');
  const [adminTokenVal, setAdminTokenVal] = useState(adminAccessToken || '');

  const handleSaveEmailSettings = (e) => {
    e.preventDefault();
    onUpdateEmailSettings({
      gateway: emailGateway,
      emailjsServiceId,
      emailjsTemplateId,
      emailjsPublicKey
    });
    onUpdateGoogleClientId(gClientId);
    onUpdateAdminAccessToken(adminTokenVal);
    alert('Gateways configurations updated.');
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      setTestEmailResult({ success: false, error: 'Please enter a valid test email address' });
      return;
    }
    
    setIsTestingEmail(true);
    setTestEmailResult(null);
    
    onUpdateEmailSettings({
      gateway: emailGateway,
      emailjsServiceId,
      emailjsTemplateId,
      emailjsPublicKey
    });
    
    const testCode = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      const res = await onSendEmailOtp(testEmail, testCode);
      if (res && res.success) {
        setTestEmailResult({ success: true, message: `Test code ${testCode} sent successfully to ${testEmail}!` });
      } else {
        setTestEmailResult({ success: false, error: res ? res.error : 'Unknown transmission failure' });
      }
    } catch (err) {
      setTestEmailResult({ success: false, error: err.message || 'Connection error' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleAuthenticate = (e) => {
    e.preventDefault();
    if (pin === '0000' || (tokenInput && tokenInput.trim() === adminAccessToken)) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('CRITICAL: ACCESS DENIED. PIN OR ACCESS TOKEN INCORRECT.');
      setPin('');
      setTokenInput('');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings({
      minTime: parseInt(minTime, 10),
      pricePerHalfHour: parseFloat(pricePerHalfHour),
      stationName,
      stationStatus
    });
    alert('Configurations applied.');
  };

  if (!isAuthenticated) {
    return (
      <div className="overlay-container">
        <div className="login-card glass border-glow animate-fade-in" style={{ maxWidth: '380px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="mono" style={{ fontSize: '0.85rem', letterSpacing: '0.15em', flexGrow: 1 }}>AUTHENTICATING LEVEL 0</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
              <X size={16} />
            </button>
          </div>
          
          <form onSubmit={handleAuthenticate}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="admin-pin-input">Terminal PIN Code</label>
              <input
                id="admin-pin-input"
                type={showPin ? 'text' : 'password'}
                maxLength="4"
                className="form-input mono-input"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em', paddingRight: '3rem' }}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '2.45rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)'
                }}
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="login-divider" style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em' }}>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
              <span style={{ padding: '0 0.5rem' }}>OR</span>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="admin-token-input">Admin Access Token</label>
              <input
                id="admin-token-input"
                type="password"
                className="form-input mono-input"
                style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}
                placeholder="Enter Access Token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            
            {error && (
              <p className="mono animate-fade-in" style={{ color: '#ff3b30', fontSize: '0.7rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                [Alert]: {error}
              </p>
            )}
            
            <button type="submit" className="btn-primary">
              Access Core <Key size={12} style={{ marginLeft: '0.25rem' }} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-container">
      <div className="admin-card glass border-glow animate-fade-in" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="admin-header">
          <div>
            <h2 className="mono" style={{ fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Terminal Settings</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Core management node for pricing and limits.
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          
          <button 
            className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            System Logs ({bookings.length})
          </button>

          <button 
            className={`admin-tab ${activeTab === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            rig pods
          </button>

          <button 
            className={`admin-tab ${activeTab === 'sms' ? 'active' : ''}`}
            onClick={() => setActiveTab('sms')}
          >
            Gateways
          </button>
        </div>

        {/* Tab 1: Settings Form */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="admin-section">
            <div className="form-group">
              <label className="form-label" htmlFor="station-name-input">Station Label</label>
              <input
                id="station-name-input"
                type="text"
                className="form-input"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="price-input">Unit rate / 30m (₹)</label>
                <input
                  id="price-input"
                  type="number"
                  min="1"
                  className="form-input mono-input"
                  value={pricePerHalfHour}
                  onChange={(e) => setPricePerHalfHour(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="min-time-input">Min Boundary (Mins)</label>
                <select
                  id="min-time-input"
                  className="form-input mono-input"
                  value={minTime}
                  onChange={(e) => setMinTime(e.target.value)}
                  style={{ padding: '0.8rem 1.25rem', background: '#050505', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="15">15 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                  <option value="90">90 mins</option>
                  <option value="120">120 mins</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2">
              Apply configurations
            </button>
          </form>
        )}

        {/* Tab 2: Logs */}
        {activeTab === 'bookings' && (
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Records</h3>
              {bookings.length > 0 && (
                <button 
                  onClick={onClearBookings} 
                  className="mono" 
                  style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'underline' }}
                >
                  Purge Registry
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>UserNode</th>
                    <th>Hardware</th>
                    <th>TimeFrame</th>
                    <th>privilege</th>
                    <th>Fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                        No session records exist in the current registry block.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div>{booking.userName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{booking.userPhone}</div>
                        </td>
                        <td>{booking.stationName}</td>
                        <td>{booking.duration} mins</td>
                        <td>
                          <span className="admin-badge">
                            {booking.accountType === 'own' ? 'User' : 'Arena'}
                          </span>
                        </td>
                        <td>₹{booking.price}</td>
                        <td>
                          <span className={`admin-badge ${booking.status === 'Active' ? 'active' : ''}`}>
                            {booking.status}
                          </span>
                          {booking.status === 'Active' && (
                            <button 
                              onClick={onEndActiveSession} 
                              style={{ 
                                marginLeft: '0.5rem', 
                                background: 'none', 
                                border: 'none', 
                                color: '#ff3b30', 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '0.65rem'
                              }}
                            >
                              terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {activeBooking && (
              <div className="glass" style={{ padding: '1.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>ENGAGED SESSION NODE ACTIVE</span>
                <button 
                  onClick={onEndActiveSession} 
                  className="mono btn-secondary" 
                  style={{ width: 'auto', padding: '0.5rem 1rem', borderColor: '#ff3b30', color: '#ff3b30', fontSize: '0.7rem' }}
                >
                  DISCONNECT SESSION
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Rig Pods */}
        {activeTab === 'stations' && (
          <div className="admin-section">
            <h3 className="mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>rig states</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Toggle nodes availability states.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '500', textTransform: 'uppercase', fontSize: '0.9rem' }}>{stationName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>IPOD_DEV: PS5_CONSOLE_ALPHA</div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => { setStationStatus('online'); onUpdateSettings({ ...settings, stationStatus: 'online' }); }}
                    className="mono"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      border: '1px solid var(--border-subtle)',
                      background: stationStatus === 'online' ? 'var(--bg-accent)' : 'transparent',
                      color: stationStatus === 'online' ? 'var(--text-inverse)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    online
                  </button>
                  <button 
                    onClick={() => { setStationStatus('maintenance'); onUpdateSettings({ ...settings, stationStatus: 'maintenance' }); }}
                    className="mono"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      border: '1px solid var(--border-subtle)',
                      background: stationStatus === 'maintenance' ? '#ff3b30' : 'transparent',
                      color: stationStatus === 'maintenance' ? 'white' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    offline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Gateways Configuration */}
        {activeTab === 'sms' && (
          <div className="admin-section" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h3 className="mono" style={{ fontSize: '0.85rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>Gateways Setup</h3>
            <form onSubmit={handleSaveEmailSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="email-gateway-select">Email Gateway Provider</label>
                <select
                  id="email-gateway-select"
                  className="form-input mono-input"
                  value={emailGateway}
                  onChange={(e) => setEmailGateway(e.target.value)}
                  style={{ padding: '0.8rem 1.25rem', background: '#050505', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="mock">Mock Gateway (Browser Toast)</option>
                  <option value="emailjs">EmailJS Service API</option>
                </select>
              </div>

              {emailGateway === 'emailjs' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="emailjs-service-id">EmailJS Service ID</label>
                    <input
                      id="emailjs-service-id"
                      type="text"
                      className="form-input mono-input"
                      placeholder="service_xxxxxxx"
                      value={emailjsServiceId}
                      onChange={(e) => setEmailjsServiceId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="emailjs-template-id">EmailJS Template ID</label>
                    <input
                      id="emailjs-template-id"
                      type="text"
                      className="form-input mono-input"
                      placeholder="template_xxxxxxx"
                      value={emailjsTemplateId}
                      onChange={(e) => setEmailjsTemplateId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="emailjs-public-key">EmailJS Public Key</label>
                    <input
                      id="emailjs-public-key"
                      type="password"
                      className="form-input mono-input"
                      placeholder="Public API Key"
                      value={emailjsPublicKey}
                      onChange={(e) => setEmailjsPublicKey(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                <label className="form-label" htmlFor="google-client-id">Google OAuth Client ID</label>
                <input
                  id="google-client-id"
                  type="password"
                  className="form-input mono-input"
                  placeholder="xxxxxx-xxxxxxxx.apps.googleusercontent.com"
                  value={gClientId}
                  onChange={(e) => setGClientId(e.target.value)}
                />
                <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Configure a Client ID from Google Cloud Console to enable official Google Sign-In button flow.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                <label className="form-label" htmlFor="admin-access-token">Admin Access Token</label>
                <input
                  id="admin-access-token"
                  type="password"
                  className="form-input mono-input"
                  placeholder="Enter Admin Access Token"
                  value={adminTokenVal}
                  onChange={(e) => setAdminTokenVal(e.target.value)}
                />
                <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Used to authenticate or bypass the Admin authentication modal (Default: admin-token-777).
                </p>
              </div>

              <button type="submit" className="btn-primary mt-2">
                Save Gateways Settings
              </button>
            </form>

            <div className="glass mt-2" style={{ padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
              <h4 className="mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Test Email Channel</h4>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                  <input
                    id="test-email-input"
                    type="email"
                    className="form-input mono-input"
                    placeholder="nithin@void.gz"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  className="btn-secondary"
                  style={{ height: '47px', width: 'auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={isTestingEmail}
                >
                  {isTestingEmail ? 'Testing...' : 'Send'}
                </button>
              </div>
              {testEmailResult && (
                <div className="mono animate-fade-in" style={{ marginTop: '0.75rem', fontSize: '0.7rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid', backgroundColor: testEmailResult.success ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 59, 48, 0.08)', borderColor: testEmailResult.success ? '#34c759' : '#ff3b30', color: testEmailResult.success ? '#34c759' : '#ff3b30' }}>
                  {testEmailResult.success ? `[SUCCESS]: ${testEmailResult.message}` : `[FAILURE]: ${testEmailResult.error}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
