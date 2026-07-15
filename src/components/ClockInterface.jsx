import React, { useState, useEffect } from 'react';
import { Minus, Plus, Gamepad2, Check, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function ClockInterface({ settings, onBookSession, activeBooking, bookings = [] }) {
  const minTime = settings.minTime || 30; // in minutes
  const pricePerHalfHour = settings.pricePerHalfHour || 75; // ₹75 per 30 minutes
  const stationName = settings.stationName || 'PlayStation 5 Console #1';
  const isOffline = settings.stationStatus === 'maintenance';

  // --- States ---
  const [duration, setDuration] = useState(minTime);
  const [accountType, setAccountType] = useState('own'); // 'own' or 'gamezone'
  const [selectedStart, setSelectedStart] = useState('now'); // 'now' or ISO string
  const [nowTime, setNowTime] = useState(new Date());

  // Ticker for live time
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync duration with minimum settings if changed
  useEffect(() => {
    if (duration < minTime) {
      setDuration(minTime);
    }
  }, [minTime, duration]);

  const incrementTime = () => {
    setDuration((prev) => Math.min(480, prev + 30));
  };

  const decrementTime = () => {
    setDuration((prev) => Math.max(minTime, prev - 30));
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    const snapped = Math.round(val / 15) * 15;
    setDuration(Math.max(minTime, snapped));
  };

  const totalPrice = Math.round((duration / 30) * pricePerHalfHour);

  const formatDisplayTime = (mins) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) return `${remainingMins}m`;
    if (remainingMins === 0) return `${hrs}h`;
    return `${hrs}h ${remainingMins}m`;
  };

  // Generate 30-minute slots inside Arena operational hours (10:00 - 23:00)
  const generateArenaSlots = () => {
    const slots = [];
    const today = new Date(nowTime);
    
    for (let hour = 10; hour < 23; hour++) {
      // Slot 1: hour:00
      const d1 = new Date(today);
      d1.setHours(hour, 0, 0, 0);
      slots.push(d1);

      // Slot 2: hour:30
      const d2 = new Date(today);
      d2.setHours(hour, 30, 0, 0);
      slots.push(d2);
    }
    return slots;
  };

  const timeSlots = generateArenaSlots();

  // Helper to check overlap with active sessions or scheduled bookings
  const checkTimeOverlap = (tickStart, tickEnd) => {
    if (activeBooking) {
      // activeBooking is running right now!
      const activeStart = new Date(Date.now() - (activeBooking.maxDuration - activeBooking.secondsRemaining) * 1000);
      const activeEnd = new Date(activeStart.getTime() + activeBooking.maxDuration * 60 * 1000);
      if (activeStart < tickEnd && activeEnd > tickStart) {
        return { isReserved: true, user: 'Active Session' };
      }
    }

    for (const b of bookings) {
      if (b.status === 'Active' || b.status === 'Scheduled') {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        if (bStart < tickEnd && bEnd > tickStart) {
          return { isReserved: true, user: b.userName };
        }
      }
    }

    return { isReserved: false };
  };

  // Live validator for selected start time + duration
  const validateBookingRange = () => {
    const start = selectedStart === 'now' ? new Date() : new Date(selectedStart);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // 1. Check if closed
    const currentHour = nowTime.getHours();
    if (selectedStart === 'now' && (currentHour < 10 || currentHour >= 23)) {
      return { isValid: false, reason: 'ARENA IS CLOSED (HOURS: 10:00 - 23:00)' };
    }

    // 2. Check if exceeds close time (23:00)
    const arenaClose = new Date(start);
    arenaClose.setHours(23, 0, 0, 0);
    if (end > arenaClose) {
      return { isValid: false, reason: 'EXCEEDS ARENA CLOSING TIME (23:00)' };
    }

    // 3. Check busy overlapping
    const overlap = checkTimeOverlap(start, end);
    if (overlap.isReserved) {
      return { isValid: false, reason: `OVERLAPS WITH RESERVED SLOT (${overlap.user})` };
    }

    return { isValid: true };
  };

  const validation = validateBookingRange();

  const handleBook = () => {
    if (!validation.isValid) return;

    const isNow = selectedStart === 'now';
    const startTimeObj = isNow ? new Date() : new Date(selectedStart);

    onBookSession({
      duration,
      accountType,
      price: totalPrice,
      stationName,
      isNow,
      startTime: startTimeObj
    });
  };

  // Format digital clock
  const liveClockString = nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', width: '100%' }}>
      
      {/* 1. CONFIGURATION CARD */}
      <div className="card glass">
        <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gamepad2 size={12} style={{ opacity: 0.6 }} /> <span>RIG CONFIGURATOR</span>
          </div>
          <div className="user-badge" style={{ borderColor: isOffline ? '#ff3b30' : activeBooking ? '#ffd60a' : '#34c759', color: isOffline ? '#ff3b30' : activeBooking ? '#ffd60a' : '#34c759' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor', marginRight: '0.4rem', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: '700' }}>
              {isOffline ? 'offline' : activeBooking ? 'busy' : 'standby'}
            </span>
          </div>
        </div>

        <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          {stationName}
        </h2>

        {isOffline ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={32} style={{ color: '#ff3b30', marginBottom: '1rem' }} />
            <p className="mono" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>THIS CONSOLE NODE IS UNDER MAINTENANCE.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Live Clock Card */}
            <div className="glass" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                <Clock size={12} /> LIVE NODE TIME
              </div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                {liveClockString}
              </div>
            </div>

            {/* Start Time Select Dropdown */}
            <div>
              <label className="form-label" htmlFor="reserve-start-time-dropdown">Start Time Slot</label>
              <select
                id="reserve-start-time-dropdown"
                className="form-input mono-input"
                value={selectedStart}
                onChange={(e) => setSelectedStart(e.target.value)}
                style={{ padding: '0.8rem 1.25rem', background: '#050505', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="now" style={{ color: '#34c759' }}>Immediate (Now)</option>
                {timeSlots.map((slot) => {
                  const isPast = slot < new Date(nowTime.getTime() - 1000 * 60 * 5); // 5 mins leeway
                  const slotEnd = new Date(slot.getTime() + duration * 60 * 1000);
                  const overlap = checkTimeOverlap(slot, slotEnd);
                  const labelStr = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  
                  return (
                    <option 
                      key={slot.toISOString()} 
                      value={slot.toISOString()}
                      disabled={isPast || overlap.isReserved}
                      style={{ color: isPast ? 'var(--text-muted)' : overlap.isReserved ? '#ff3b30' : 'var(--text-primary)' }}
                    >
                      {labelStr} {isPast ? '(Past)' : overlap.isReserved ? '(Busy)' : '(Free)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Playtime Duration Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Playtime Length</label>
                <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  {formatDisplayTime(duration)}
                </span>
              </div>
              <div className="duration-slider-wrapper" style={{ margin: '0 auto', width: '100%', maxWidth: 'none' }}>
                <button 
                  onClick={decrementTime} 
                  disabled={duration <= minTime || (selectedStart === 'now' && !!activeBooking)}
                  className="slider-btn"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="range"
                  min={minTime}
                  max="480"
                  step="15"
                  value={duration}
                  onChange={handleSliderChange}
                  disabled={selectedStart === 'now' && !!activeBooking}
                  className="custom-range-slider"
                />
                <button 
                  onClick={incrementTime} 
                  disabled={duration >= 480 || (selectedStart === 'now' && !!activeBooking)}
                  className="slider-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Credential Privilege Selection */}
            <div>
              <h3 className="card-subtitle">Credential Privilege</h3>
              <div className="account-selector" style={{ marginTop: '0.5rem' }}>
                <div 
                  className={`account-option ${(selectedStart === 'now' && activeBooking) ? 'disabled' : ''} ${accountType === 'own' ? 'selected' : ''}`}
                  onClick={() => !(selectedStart === 'now' && activeBooking) && setAccountType('own')}
                >
                  <div className="option-title">User Account</div>
                  <div className="option-desc">Connect using personal PSN credentials.</div>
                </div>
                <div 
                  className={`account-option ${(selectedStart === 'now' && activeBooking) ? 'disabled' : ''} ${accountType === 'gamezone' ? 'selected' : ''}`}
                  onClick={() => !(selectedStart === 'now' && activeBooking) && setAccountType('gamezone')}
                >
                  <div className="option-title">Arena Account</div>
                  <div className="option-desc">Play instantly using pre-loaded games.</div>
                </div>
              </div>
            </div>

            {/* Validation Feedback Warning Box */}
            {!validation.isValid && (
              <div className="glass border-glow" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={14} style={{ color: '#ff3b30', flexShrink: 0 }} />
                <span className="mono" style={{ fontSize: '0.65rem', color: '#ff3b30', letterSpacing: '0.05em' }}>
                  {validation.reason}
                </span>
              </div>
            )}

            {/* Pricing Summary & Booking Trigger */}
            <div className="booking-summary-row" style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="summary-price-container estimated-rate-container">
                <span className="summary-price-label">Estimated Rate</span>
                <span className="summary-price" style={{ fontSize: '1.75rem', marginTop: '0' }}>₹{totalPrice}</span>
              </div>
              <button 
                onClick={handleBook} 
                disabled={!validation.isValid}
                className="btn-primary"
                style={{ flexGrow: 1 }}
              >
                {selectedStart === 'now' ? 'Book Station' : 'Reserve Slot'} <Check size={14} />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* 2. TIMELINE VISUAL SCHEDULER CARD */}
      <div className="card glass">
        <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={12} style={{ opacity: 0.6 }} /> <span>ARENA BOOKING TIMELINE</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>10:00 - 23:00</span>
        </div>

        <h3 className="card-title" style={{ fontSize: '1rem', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          DAILY TIME SLOTS
        </h3>

        {isOffline ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            TIMELINE SUSPENDED FOR NODE REPAIR.
          </div>
        ) : (
          <div className="timeline-container">
            {/* Immediate "Now" selector button */}
            <div 
              onClick={() => {
                const hr = nowTime.getHours();
                if (hr >= 10 && hr < 23 && !activeBooking) {
                  setSelectedStart('now');
                }
              }}
              className={`timeline-slot ${selectedStart === 'now' ? 'selected' : ''} ${activeBooking ? 'busy' : (nowTime.getHours() < 10 || nowTime.getHours() >= 23) ? 'past' : 'free'}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: '700' }}>Immediate (Now)</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Start current session instantly
                </span>
              </div>
              <div className="mono" style={{ fontSize: '0.65rem', fontWeight: '600' }}>
                {activeBooking ? `[BUSY UNTIL ${activeBooking.reservedTime}]` : (nowTime.getHours() < 10 || nowTime.getHours() >= 23) ? '[CLOSED]' : '[FREE]'}
              </div>
            </div>

            {/* Loop through generated 30-min daily slots */}
            {timeSlots.map((slot) => {
              const slotIso = slot.toISOString();
              const isPast = slot < new Date(nowTime.getTime() - 1000 * 60 * 5); // 5 mins leeway
              const slotEnd = new Date(slot.getTime() + 30 * 60 * 1000);
              const overlap = checkTimeOverlap(slot, slotEnd);
              
              const labelStart = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              const labelEnd = slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              
              const isSelected = selectedStart === slotIso;

              return (
                <div
                  key={slotIso}
                  onClick={() => {
                    if (!isPast && !overlap.isReserved) {
                      setSelectedStart(slotIso);
                    }
                  }}
                  className={`timeline-slot ${isSelected ? 'selected' : ''} ${isPast ? 'past' : overlap.isReserved ? 'busy' : 'free'}`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="mono" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                      {labelStart} - {labelEnd}
                    </span>
                    {overlap.isReserved && (
                      <span style={{ fontSize: '0.6rem', color: '#ff3b30', marginTop: '0.15rem' }}>
                        Reserved by {overlap.user || 'Guest'}
                      </span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: '0.65rem', fontWeight: '600' }}>
                    {isPast ? '[PAST]' : overlap.isReserved ? '[BUSY]' : '[FREE]'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
