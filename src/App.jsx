import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Login from './components/Login';
import ShapeGrid from './components/ShapeGrid';
import ClockInterface from './components/ClockInterface';
import ContactLocation from './components/ContactLocation';
import AdminPanel from './components/AdminPanel';
import { LogOut, Wifi, Clock } from 'lucide-react';

// Default configurations
const DEFAULT_SETTINGS = {
  minTime: 30, // in minutes
  pricePerHalfHour: 50, // ₹50 per 30 minutes
  stationName: 'PlayStation 5 Console #1',
  stationStatus: 'online'
};

export default function App() {
  // --- Persistent States from LocalStorage ---
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gz_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('gz_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('gz_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [stations, setStations] = useState(() => {
    const saved = localStorage.getItem('gz_stations');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'PlayStation 5 Console #1', status: 'online' }
    ];
  });

  const [selectedStationName, setSelectedStationName] = useState(() => {
    const saved = localStorage.getItem('gz_stations');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed[0].name : 'PlayStation 5 Console #1';
  });

  const [activeBookings, setActiveBookings] = useState(() => {
    const saved = localStorage.getItem('gz_active_bookings');
    return saved ? JSON.parse(saved) : {};
  });



  const [emailGatewaySettings, setEmailGatewaySettings] = useState(() => {
    const saved = localStorage.getItem('gz_email_settings');
    return saved ? JSON.parse(saved) : {
      gateway: 'mock',
      emailjsServiceId: '',
      emailjsTemplateId: '',
      emailjsPublicKey: ''
    };
  });

  const [googleClientId, setGoogleClientId] = useState(() => {
    return localStorage.getItem('gz_google_client_id') || '';
  });

  const [adminAccessToken, setAdminAccessToken] = useState(() => {
    return localStorage.getItem('gz_admin_access_token') || 'admin-token-777';
  });

  const [cfWorkerUrl, setCfWorkerUrl] = useState(() => {
    return localStorage.getItem('gz_cf_worker_url') || 'https://gamezone-backend.white018899.workers.dev';
  });

  const [dbStatus, setDbStatus] = useState(() => {
    return (localStorage.getItem('gz_cf_worker_url') || 'https://gamezone-backend.white018899.workers.dev') ? 'connecting' : 'local';
  });

  useEffect(() => {
    if (cfWorkerUrl) {
      localStorage.setItem('gz_cf_worker_url', cfWorkerUrl);
    } else {
      localStorage.removeItem('gz_cf_worker_url');
      setDbStatus('local');
    }
  }, [cfWorkerUrl]);

  // Pull Cloud Data Effect
  useEffect(() => {
    if (!cfWorkerUrl) {
      setDbStatus('local');
      return;
    }

    const loadCloudData = async () => {
      try {
        setDbStatus('connecting');
        const res = await fetch(`${cfWorkerUrl.replace(/\/$/, '')}/api/data`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        
        if (data && data.found !== false) {
          if (data.settings) setSettings(data.settings);
          if (data.stations) setStations(data.stations);
          if (data.bookings) setBookings(data.bookings);
          if (data.activeBookings) setActiveBookings(data.activeBookings);
          if (data.emailGatewaySettings) setEmailGatewaySettings(data.emailGatewaySettings);
          if (data.googleClientId) setGoogleClientId(data.googleClientId);
          if (data.adminAccessToken) setAdminAccessToken(data.adminAccessToken);
          
          showToast('🤖 Serverless cloud database synced.');
        }
        setDbStatus('online');
      } catch (err) {
        console.error('Failed to sync cloud databases:', err);
        setDbStatus('error');
        showToast('⚠️ Cloud database connection failed. Running offline mode.');
      }
    };

    loadCloudData();
  }, [cfWorkerUrl]);

  // Push Cloud Data Effect
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (!cfWorkerUrl) return;

    const pushCloudData = async () => {
      try {
        const payload = {
          settings,
          stations,
          bookings,
          activeBookings,
          emailGatewaySettings,
          googleClientId,
          adminAccessToken
        };
        
        const res = await fetch(`${cfWorkerUrl.replace(/\/$/, '')}/api/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      } catch (err) {
        console.error('Failed to save cloud updates:', err);
      }
    };

    const handler = setTimeout(pushCloudData, 1000);
    return () => clearTimeout(handler);
  }, [cfWorkerUrl, settings, stations, bookings, activeBookings, emailGatewaySettings, googleClientId, adminAccessToken]);



  // --- Temporary UI States ---
  const [showAdmin, setShowAdmin] = useState(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    return path.includes('/admin') || searchParams.has('admin') || window.location.hash.includes('admin');
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const isAdmin = path.includes('/admin') || searchParams.has('admin') || window.location.hash.includes('admin');
      setShowAdmin(isAdmin);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const [toasts, setToasts] = useState([]);
  
  // Timer Ref
  const timerRef = useRef(null);

  // Sync state modifications to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('gz_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gz_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('gz_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('gz_bookings', JSON.stringify(bookings));
  }, [bookings]);



  useEffect(() => {
    localStorage.setItem('gz_email_settings', JSON.stringify(emailGatewaySettings));
  }, [emailGatewaySettings]);

  useEffect(() => {
    localStorage.setItem('gz_google_client_id', googleClientId);
  }, [googleClientId]);

  useEffect(() => {
    localStorage.setItem('gz_admin_access_token', adminAccessToken);
  }, [adminAccessToken]);

  useEffect(() => {
    localStorage.setItem('gz_stations', JSON.stringify(stations));
  }, [stations]);

  useEffect(() => {
    localStorage.setItem('gz_active_bookings', JSON.stringify(activeBookings));
  }, [activeBookings]);

  // Handle active sessions countdown
  useEffect(() => {
    const activeKeys = Object.keys(activeBookings);
    if (activeKeys.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setActiveBookings((prev) => {
          const updated = { ...prev };
          let changed = false;

          for (const stationName of Object.keys(updated)) {
            const session = updated[stationName];
            if (session.secondsRemaining <= 1) {
              // Complete session
              const finishedRecord = {
                id: session.id,
                userName: user?.name || 'Unknown',
                userPhone: user?.phone || 'N/A',
                stationName: session.stationName,
                duration: session.duration,
                accountType: session.accountType,
                price: session.price,
                status: 'Completed',
                timestamp: new Date().toLocaleString()
              };
              setBookings((old) => [finishedRecord, ...old]);
              showToast(`⚡ Session on ${session.stationName} completed successfully!`);
              delete updated[stationName];
              changed = true;
            } else {
              updated[stationName] = {
                ...session,
                secondsRemaining: session.secondsRemaining - 1
              };
              changed = true;
            }
          }
          return changed ? updated : prev;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBookings, user]);

  // Handle auto-activation of scheduled bookings when real time hits start time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const scheduled = bookings.find(
        (b) => b.status === 'Scheduled' && new Date(b.startTime) <= now
      );

      if (scheduled && !activeBookings[scheduled.stationName]) {
        const newSession = {
          id: scheduled.id,
          stationName: scheduled.stationName,
          duration: scheduled.duration,
          accountType: scheduled.accountType,
          price: scheduled.price,
          secondsRemaining: scheduled.duration,
          maxDuration: scheduled.duration,
          reservedTime: new Date(scheduled.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        };

        setBookings((prev) =>
          prev.map((b) => (b.id === scheduled.id ? { ...b, status: 'Active' } : b))
        );
        setActiveBookings((prev) => ({
          ...prev,
          [scheduled.stationName]: newSession
        }));
        showToast(`⚡ Scheduled slot on ${scheduled.stationName} is now ACTIVE!`);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookings, activeBookings]);

  // Toast Helper
  const showToast = (message, otp = null) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, otp }]);
    
    // Automatically fade out after 8 seconds (long enough to copy code)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Handlers ---
  const handleLogin = (userInfo) => {
    setUser(userInfo);
    showToast(`Welcome back, ${userInfo.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveBookings({});
    showToast('Logged out of system.');
  };

  const handleBookSession = (bookingDetails) => {
    if (!user) return;

    const startTime = bookingDetails.startTime ? new Date(bookingDetails.startTime) : new Date();
    const endTime = new Date(startTime.getTime() + bookingDetails.duration * 60 * 1000);
    const isNow = bookingDetails.isNow;

    const record = {
      id: Date.now().toString(),
      userName: user.name,
      userPhone: user.phone,
      stationName: bookingDetails.stationName,
      duration: bookingDetails.duration,
      accountType: bookingDetails.accountType,
      price: bookingDetails.price,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: isNow ? 'Active' : 'Scheduled',
      timestamp: new Date().toLocaleString()
    };

    if (isNow) {
      const newSession = {
        id: record.id,
        stationName: bookingDetails.stationName,
        duration: bookingDetails.duration,
        accountType: bookingDetails.accountType,
        price: bookingDetails.price,
        secondsRemaining: bookingDetails.duration,
        maxDuration: bookingDetails.duration,
        reservedTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      };
      setActiveBookings((prev) => ({
        ...prev,
        [bookingDetails.stationName]: newSession
      }));
    }

    setBookings((old) => [record, ...old]);
    showToast(isNow ? `⚡ Station booked immediately!` : `📅 Reserved slot for ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}!`);
  };

  const handleEndActiveSession = (stationName) => {
    const targetSession = activeBookings[stationName];
    if (!targetSession) return;
    
    // End session early
    const updatedBookings = bookings.map((b) => {
      if (b.id === targetSession.id) {
        return {
          ...b,
          status: 'Ended Early',
          duration: targetSession.maxDuration - Math.ceil(targetSession.secondsRemaining),
          timestamp: new Date().toLocaleString()
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    setActiveBookings((prev) => {
      const updated = { ...prev };
      delete updated[stationName];
      return updated;
    });
    showToast(`Session on ${stationName} terminated.`);
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const handleClearBookings = () => {
    setBookings([]);
    showToast('Booking records database cleared.');
  };



  const sendEmailOtp = async (email, code) => {
    const { gateway, emailjsServiceId, emailjsTemplateId, emailjsPublicKey } = emailGatewaySettings;
    
    try {
      if (gateway === 'mock') {
        showToast(`📧 Mock Email OTP sent to ${email}:`, code);
        return { success: true };
      }
      
      if (gateway === 'emailjs') {
        if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
          return { success: false, error: 'EmailJS configurations are incomplete' };
        }
        
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_id: emailjsServiceId,
            template_id: emailjsTemplateId,
            user_id: emailjsPublicKey,
            template_params: {
              to_email: email,
              to_name: email.split('@')[0],
              otp_code: code,
              message: `Your VOID.GZ verification code is: ${code}`
            }
          })
        });
        
        if (response.ok) {
          showToast(`⚡ Real OTP sent via EmailJS to ${email}`);
          return { success: true };
        } else {
          const errText = await response.text();
          return { success: false, error: errText || 'EmailJS transmission failed' };
        }
      }
      
      return { success: false, error: 'Unknown Email Gateway' };
    } catch (err) {
      console.error('Email Gateway Error:', err);
      return { success: false, error: err.message || 'Network connection error' };
    }
  };

  // Format active session remaining seconds into MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const padMin = mins.toString().padStart(2, '0');
    const padSec = secs.toString().padStart(2, '0');
    return `${padMin}:${padSec}`;
  };

  return (
    <div className="app-container">
      <ShapeGrid 
        speed={0.25} 
        squareSize={50}
        direction='diagonal'
        borderColor='rgba(255, 255, 255, 0.03)'
        hoverFillColor='rgba(255, 255, 255, 0.05)'
        shape='square'
        hoverTrailAmount={6}
        className="shape-grid-background"
      />

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast" onClick={() => removeToast(toast.id)}>
            <div style={{ flexGrow: 1 }}>{toast.message}</div>
            {toast.otp && (
              <span className="toast-otp-code">{toast.otp}</span>
            )}
            <button style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <header className="app-header">
        <div className="header-container">
          <a href="#" className="logo">
            VOID<span className="logo-dot"></span>GAMING ZONE
          </a>

          <div className="header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Connection Status Badge */}
            <div className="user-badge" style={{ 
              borderColor: dbStatus === 'online' ? 'rgba(52, 199, 89, 0.2)' : dbStatus === 'error' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 255, 255, 0.15)', 
              color: dbStatus === 'online' ? '#34c759' : dbStatus === 'error' ? '#ff3b30' : 'var(--text-secondary)' 
            }}>
              <Wifi size={12} className={dbStatus === 'connecting' ? 'animate-pulse' : ''} />
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '500' }}>
                {dbStatus === 'online' ? 'Cloud Online' : dbStatus === 'error' ? 'Sync Error' : dbStatus === 'connecting' ? 'Connecting' : 'Local DB'}
              </span>
            </div>

            {user ? (
              <>
                <div className="user-badge">
                  <span className="user-badge-dot"></span>
                  <span>{user.name.split(' ')[0]}</span>
                </div>
                <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                  <LogOut size={12} /> Exit
                </button>
              </>
            ) : (
              <div className="user-badge" style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: 'var(--text-secondary)' }}>
                <span>Standby</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* If user is not authenticated, show login page overlay */}
        {!user && (
          <Login 
            onLoginSuccess={handleLogin} 
            onSendEmailOtp={sendEmailOtp}
            googleClientId={googleClientId}
          />
        )}

        {/* Active Booking Banners */}
        {Object.values(activeBookings).map((session) => (
          <div key={session.id} className="active-session-banner border-glow" style={{ marginBottom: '1.25rem' }}>
            <div className="session-info">
              <div className="session-status">
                <Clock size={12} className="animate-spin-slow" /> ACTIVE TIMER
              </div>
              <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>{session.stationName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Playing on: <span className="mono" style={{ textTransform: 'uppercase' }}>{session.accountType} account</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div className="session-timer-large">
                {formatTimer(session.secondsRemaining)}
              </div>
              <button 
                onClick={() => handleEndActiveSession(session.stationName)} 
                className="btn-secondary" 
                style={{ borderColor: '#ff453a', color: '#ff453a', width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                End Session
              </button>
            </div>
          </div>
        ))}

        {/* Consoles / Rig Pods Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {stations.map((st) => {
            const activeSession = activeBookings[st.name];
            const isSelected = selectedStationName === st.name;
            return (
              <div 
                key={st.id} 
                onClick={() => setSelectedStationName(st.name)}
                className={`glass ${isSelected ? 'border-glow' : ''}`}
                style={{ 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(255,255,255,0.03)' : 'rgba(3,3,3,0.5)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                    IPOD_DEV: POD_{st.id}
                  </span>
                  <span className="mono" style={{ 
                    fontSize: '0.55rem', 
                    textTransform: 'uppercase', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '2px',
                    fontWeight: '600',
                    letterSpacing: '0.05em',
                    backgroundColor: st.status === 'maintenance' ? 'rgba(255,59,48,0.1)' : activeSession ? 'rgba(255,214,10,0.1)' : 'rgba(52,199,89,0.1)',
                    color: st.status === 'maintenance' ? '#ff3b30' : activeSession ? '#ffd60a' : '#34c759'
                  }}>
                    {st.status === 'maintenance' ? 'offline' : activeSession ? 'active' : 'online'}
                  </span>
                </div>
                <h4 className="mono" style={{ fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{st.name}</h4>
                {activeSession ? (
                  <div className="mono" style={{ fontSize: '0.85rem', color: '#ffd60a', marginTop: '0.5rem', fontWeight: '600' }}>
                    REMAINING: {formatTimer(activeSession.secondsRemaining)}
                  </div>
                ) : (
                  <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {st.status === 'maintenance' ? 'Under Maintenance' : 'Available for Booking'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Grid Dashboard */}
        <div className="dashboard-grid">
          {/* Station / Clock Select Panel */}
          <ClockInterface 
            settings={{
              minTime: settings.minTime,
              pricePerHalfHour: settings.pricePerHalfHour,
              stationName: selectedStationName,
              stationStatus: stations.find(s => s.name === selectedStationName)?.status || 'online'
            }} 
            onBookSession={handleBookSession}
            activeBooking={activeBookings[selectedStationName]}
            bookings={bookings.filter(b => b.stationName === selectedStationName)}
          />

          {/* Location & Details Desk Panel */}
          <ContactLocation />
        </div>
      </main>

      {/* Admin Panel Modal Overlay */}
      {showAdmin && (
        <AdminPanel 
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          emailGatewaySettings={emailGatewaySettings}
          onUpdateEmailSettings={setEmailGatewaySettings}
          onSendEmailOtp={sendEmailOtp}
          googleClientId={googleClientId}
          onUpdateGoogleClientId={setGoogleClientId}
          adminAccessToken={adminAccessToken}
          onUpdateAdminAccessToken={setAdminAccessToken}
          stations={stations}
          onUpdateStations={setStations}
          user={user}
          bookings={bookings}
          activeBookings={activeBookings}
          onClearBookings={handleClearBookings}
          onEndActiveSession={handleEndActiveSession}
          showToast={showToast}
          cfWorkerUrl={cfWorkerUrl}
          onUpdateCfWorkerUrl={setCfWorkerUrl}
          onClose={() => {
            setShowAdmin(false);
            window.history.pushState(null, '', '/');
          }}
        />
      )}

      {/* Main Footer */}
      <footer className="app-footer">
        <div className="footer-container" style={{ justifyContent: 'center' }}>
          <div>
            &copy; {new Date().getFullYear()} VOID GAMING ZONE. ALL RIGS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
