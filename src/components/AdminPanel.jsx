import React, { useState } from 'react';
import { X, Settings, Database, Server, Key, Eye, EyeOff } from 'lucide-react';

export default function AdminPanel({ settings, onUpdateSettings, bookings, onClose, onClearBookings, onEndActiveSession, activeBooking }) {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  
  const [minTime, setMinTime] = useState(settings.minTime || 30);
  const [pricePerHalfHour, setPricePerHalfHour] = useState(settings.pricePerHalfHour || 50);
  const [stationName, setStationName] = useState(settings.stationName || 'PlayStation 5 Console #1');
  const [stationStatus, setStationStatus] = useState(settings.stationStatus || 'online');

  const [activeTab, setActiveTab] = useState('settings');

  const handleAuthenticate = (e) => {
    e.preventDefault();
    if (pin === '0000') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('CRITICAL: ACCESS DENIED. PIN INCORRECT.');
      setPin('');
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
          <div style={{ display: 'flex', justifyContext: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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
                required
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
                  style={{ height: '47px', background: '#050505', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
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
      </div>
    </div>
  );
}
