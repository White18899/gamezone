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

  const [activeBooking, setActiveBooking] = useState(() => {
    const saved = localStorage.getItem('gz_active_booking');
    return saved ? JSON.parse(saved) : null;
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
    if (activeBooking) {
      localStorage.setItem('gz_active_booking', JSON.stringify(activeBooking));
    } else {
      localStorage.removeItem('gz_active_booking');
    }
  }, [activeBooking]);

  // Handle active session countdown
  useEffect(() => {
    if (activeBooking) {
      // Clear any existing intervals
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setActiveBooking((prev) => {
          if (!prev) return null;
          if (prev.secondsRemaining <= 1) {
            clearInterval(timerRef.current);
            // Add session as finished in logs
            const finishedRecord = {
              id: prev.id,
              userName: user?.name || 'Unknown',
              userPhone: user?.phone || 'N/A',
              stationName: prev.stationName,
              duration: prev.duration,
              accountType: prev.accountType,
              price: prev.price,
              status: 'Completed',
              timestamp: new Date().toLocaleString()
            };
            setBookings((old) => [finishedRecord, ...old]);
            showToast('⚡ Session completed successfully!');
            return null;
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1
          };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBooking, user]);

  // Handle auto-activation of scheduled bookings when real time hits start time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const scheduled = bookings.find(
        (b) => b.status === 'Scheduled' && new Date(b.startTime) <= now
      );

      if (scheduled && !activeBooking) {
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
        setActiveBooking(newSession);
        showToast(`⚡ Scheduled slot is now ACTIVE!`);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookings, activeBooking]);

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
    setActiveBooking(null);
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
      setActiveBooking(newSession);
    }

    setBookings((old) => [record, ...old]);
    showToast(isNow ? `⚡ Station booked immediately!` : `📅 Reserved slot for ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}!`);
  };

  const handleEndActiveSession = () => {
    if (!activeBooking) return;
    
    // End session early
    const updatedBookings = bookings.map((b) => {
      if (b.id === activeBooking.id) {
        return {
          ...b,
          status: 'Ended Early',
          duration: activeBooking.maxDuration - Math.ceil(activeBooking.secondsRemaining),
          timestamp: new Date().toLocaleString()
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    setActiveBooking(null);
    showToast('Session terminated by user.');
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

          <div className="header-actions">
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
                <Wifi size={12} className="animate-pulse" /> Offline Mode
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

        {/* Active Booking Banner */}
        {activeBooking && (
          <div className="active-session-banner border-glow">
            <div className="session-info">
              <div className="session-status">
                <Clock size={12} className="animate-spin-slow" /> ACTIVE TIMER
              </div>
              <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>{activeBooking.stationName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Playing on: <span className="mono" style={{ textTransform: 'uppercase' }}>{activeBooking.accountType} account</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div className="session-timer-large">
                {formatTimer(activeBooking.secondsRemaining)}
              </div>
              <button 
                onClick={handleEndActiveSession} 
                className="btn-secondary" 
                style={{ borderColor: '#ff453a', color: '#ff453a', width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Main Grid Dashboard */}
        <div className="dashboard-grid">
          {/* Station / Clock Select Panel */}
          <ClockInterface 
            settings={settings} 
            onBookSession={handleBookSession}
            activeBooking={activeBooking}
            bookings={bookings}
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
          user={user}
          bookings={bookings}
          activeBooking={activeBooking}
          onClearBookings={handleClearBookings}
          onEndActiveSession={handleEndActiveSession}
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
