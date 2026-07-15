import React, { useState, useEffect } from 'react';
import { Minus, Plus, Gamepad2, Check, Calendar } from 'lucide-react';

export default function ClockInterface({ settings, onBookSession, activeBooking, bookings = [] }) {
  const minTime = settings.minTime || 30; // in minutes
  const pricePerHalfHour = settings.pricePerHalfHour || 50;
  const stationName = settings.stationName || 'PlayStation 5 Console #1';
  const isOffline = settings.stationStatus === 'maintenance';

  // --- States ---
  const [duration, setDuration] = useState(minTime);
  const [accountType, setAccountType] = useState('own'); // 'own' or 'gamezone'
  const [selectedStart, setSelectedStart] = useState('now'); // 'now' or ISO timestamp
  const [hoveredTick, setHoveredTick] = useState(null); // index (0-23)
  const [nowTime, setNowTime] = useState(new Date());

  // Ticker to update slots time reference
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync duration with settings change if active duration is less than new minTime
  useEffect(() => {
    if (duration < minTime) {
      setDuration(minTime);
    }
  }, [minTime, duration]);

  // Adjust duration by 30-min steps
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

  // Generate slots for schedule (30 min intervals, 24 slots total)
  const generateSlots = () => {
    const slots = [];
    const coeff = 1000 * 60 * 30; // 30 mins
    const startOfNextSlot = new Date(Math.ceil(nowTime.getTime() / coeff) * coeff);

    for (let i = 0; i < 24; i++) {
      const slotTime = new Date(startOfNextSlot.getTime() + i * 30 * 60 * 1000);
      const timeString = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      slots.push({
        value: slotTime.toISOString(),
        label: timeString,
        date: slotTime
      });
    }
    return slots;
  };

  const timeSlots = generateSlots();
  const selectedIndex = timeSlots.findIndex((s) => s.value === selectedStart);
  const durationTicksCount = Math.ceil(duration / 30);

  // Range helper
  const getSelectedRange = () => {
    const start = selectedStart === 'now' ? new Date() : new Date(selectedStart);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    return { start, end };
  };

  const currentPreview = getSelectedRange();

  // Check overlap helper
  const checkTimeOverlap = (tickStart, tickEnd) => {
    if (activeBooking) {
      const activeStart = new Date(Date.now() - (activeBooking.maxDuration - activeBooking.secondsRemaining) * 1000);
      const activeEnd = new Date(activeStart.getTime() + activeBooking.maxDuration * 60 * 1000);
      if (activeStart < tickEnd && activeEnd > tickStart) {
        return { isReserved: true };
      }
    }

    for (const b of bookings) {
      if (b.status === 'Active' || b.status === 'Scheduled') {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        if (bStart < tickEnd && bEnd > tickStart) {
          return { isReserved: true };
        }
      }
    }

    return { isReserved: false };
  };

  // Clock A geometry
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(1, (duration - minTime) / (480 - minTime || 1));
  const strokeDashoffset = circumference - percentage * circumference;

  // Click handler on Clock B tick
  const handleTickClick = (index) => {
    const slot = timeSlots[index];
    // Set selected start time to the clicked slot's ISO timestamp
    setSelectedStart(slot.value);
  };

  // Clock B ticks generator (both visible ticks and transparent hitboxes)
  const renderScheduleTicks = () => {
    const elements = [];
    const center = 100;
    const innerRadius = 56;
    const outerRadius = 70;
    const hitInner = 45;
    const hitOuter = 78;

    for (let i = 0; i < 24; i++) {
      const tickStart = timeSlots[i]?.date || new Date();
      const slotHour = tickStart.getHours();
      const slotMin = tickStart.getMinutes();
      const angleDeg = (slotHour % 12) * 30 + (slotMin / 60) * 30 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const tickEnd = new Date(tickStart.getTime() + 30 * 60 * 1000);

      const overlap = checkTimeOverlap(tickStart, tickEnd);
      const isReserved = overlap.isReserved;

      // Check if tick is part of selected preview range
      const isSelectedPreview = selectedStart !== 'now' && selectedIndex !== -1 && 
        ((i - selectedIndex + 24) % 24 < durationTicksCount);

      // Check if tick is part of hover preview range
      const isHoverPreview = hoveredTick !== null && 
        ((i - hoveredTick + 24) % 24 < durationTicksCount);

      // Math coordinates
      const x1 = center + innerRadius * Math.cos(angleRad);
      const y1 = center + innerRadius * Math.sin(angleRad);
      const x2 = center + outerRadius * Math.cos(angleRad);
      const y2 = center + outerRadius * Math.sin(angleRad);

      const hx1 = center + hitInner * Math.cos(angleRad);
      const hy1 = center + hitInner * Math.sin(angleRad);
      const hx2 = center + hitOuter * Math.cos(angleRad);
      const hy2 = center + hitOuter * Math.sin(angleRad);

      let strokeColor = 'rgba(255, 255, 255, 0.05)';
      let strokeWidth = '1.5px';
      let filterStyle = {};

      if (isReserved) {
        strokeColor = '#ffffff';
        strokeWidth = '3.5px';
      } else if (isSelectedPreview) {
        strokeColor = '#ffffff';
        strokeWidth = '3.5px';
        filterStyle = { filter: 'drop-shadow(0 0 4px #ffffff)' };
      } else if (isHoverPreview) {
        strokeColor = 'rgba(255, 255, 255, 0.35)';
        strokeWidth = '3px';
      }

      // 1. Draw visual tick line
      elements.push(
        <line
          key={`v-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          style={filterStyle}
        />
      );

      // 2. Draw invisible hitbox for easy clicks
      elements.push(
        <line
          key={`h-${i}`}
          x1={hx1}
          y1={hy1}
          x2={hx2}
          y2={hy2}
          stroke="transparent"
          strokeWidth="12"
          style={{ cursor: isOffline || isReserved ? 'not-allowed' : 'pointer' }}
          onMouseEnter={() => !isOffline && !isReserved && setHoveredTick(i)}
          onMouseLeave={() => setHoveredTick(null)}
          onClick={() => !isOffline && !isReserved && handleTickClick(i)}
        />
      );
    }

    return elements;
  };

  // Center display text configuration for Clock B
  const getClockBText = () => {
    if (isOffline) {
      return {
        value: 'OFFLINE',
        label: 'MAINTENANCE',
        action: null,
        cursor: 'default'
      };
    }
    
    const formattedEnd = currentPreview.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (hoveredTick !== null) {
      const tickStart = timeSlots[hoveredTick]?.date || new Date();
      const tickEnd = new Date(tickStart.getTime() + duration * 60 * 1000);
      const formattedTickEnd = tickEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      return {
        value: timeSlots[hoveredTick]?.label || '',
        label: `TO ${formattedTickEnd}`,
        action: null,
        cursor: 'default'
      };
    }
    if (selectedStart !== 'now') {
      const selectedLabel = timeSlots[selectedIndex]?.label || '';
      return {
        value: selectedLabel,
        label: `RESET (TO ${formattedEnd})`,
        action: () => setSelectedStart('now'),
        cursor: 'pointer'
      };
    }
    return {
      value: 'NOW',
      label: `TO ${formattedEnd}`,
      action: null,
      cursor: 'default'
    };
  };

  const clockBInfo = getClockBText();

  const handleBook = () => {
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

  return (
    <div className="card glass">
      {/* Header Info */}
      <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Gamepad2 size={12} style={{ opacity: 0.6 }} /> RIG NODE STATE
      </div>
      <div className="card-title" style={{ marginTop: '0.25rem', marginBottom: '2.5rem' }}>
        <span>{stationName}</span>
        <span className="station-badge" style={{
          backgroundColor: isOffline ? 'rgba(255, 59, 48, 0.1)' : activeBooking ? 'rgba(255, 214, 10, 0.1)' : 'rgba(52, 199, 89, 0.1)',
          color: isOffline ? '#ff3b30' : activeBooking ? '#ffd60a' : '#34c759',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <span className="station-status-indicator" style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isOffline ? '#ff3b30' : activeBooking ? '#ffd60a' : '#34c759'
          }}></span>
          {isOffline ? 'Offline' : activeBooking ? 'Busy' : 'Standby'}
        </span>
      </div>

      {/* CLOCKS LAYOUT: Clock A (Duration) and Clock B (Availability & Click Schedule) */}
      <div className="clocks-container" style={{ display: 'flex', justifyContent: 'space-around', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        
        {/* Clock A: Duration limit */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="card-subtitle" style={{ fontSize: '0.6rem', letterSpacing: '0.12em', marginBottom: '1rem' }}>CLOCK A: PLAYTIME LIMIT</span>
          <div className="svg-dial-wrapper" style={{ width: '180px', height: '180px' }}>
            <svg className="dial-svg" viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
              <circle
                className="dial-track"
                cx="100"
                cy="100"
                r={radius}
                strokeWidth="2.5"
                transform="rotate(-90 100 100)"
              />
              <circle
                className="dial-progress"
                cx="100"
                cy="100"
                r={radius}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="clock-center-info">
              <span className="clock-time" style={{ fontSize: '2.25rem' }}>{formatDisplayTime(duration)}</span>
              <span className="clock-label" style={{ fontSize: '0.55rem', letterSpacing: '0.1em' }}>Duration</span>
            </div>
          </div>
        </div>

        {/* Clock B: Interactive Timeline Schedule (Reserved & Free time) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="card-subtitle" style={{ fontSize: '0.6rem', letterSpacing: '0.12em', marginBottom: '1rem' }}>CLOCK B: BOOKING TIMELINE</span>
          <div className="svg-dial-wrapper" style={{ width: '180px', height: '180px' }}>
            <svg className="dial-svg" viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="2.5" />
              {renderScheduleTicks()}
              {/* Clock Marks 12, 3, 6, 9 */}
              <text x="100" y="18" textAnchor="middle" className="mono" style={{ fill: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '500' }}>12</text>
              <text x="182" y="104" textAnchor="middle" className="mono" style={{ fill: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '500' }}>3</text>
              <text x="100" y="188" textAnchor="middle" className="mono" style={{ fill: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '500' }}>6</text>
              <text x="18" y="104" textAnchor="middle" className="mono" style={{ fill: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '500' }}>9</text>
            </svg>
            <div 
              className="clock-center-info" 
              onClick={!isOffline ? clockBInfo.action : null}
              style={{ cursor: clockBInfo.cursor, userSelect: 'none' }}
            >
              <span className="clock-time" style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}>{clockBInfo.value}</span>
              <span 
                className="clock-label" 
                style={{ 
                  fontSize: '0.55rem', 
                  letterSpacing: '0.1em', 
                  color: clockBInfo.label === 'RESET TO NOW' ? '#ffffff' : 'var(--text-secondary)',
                  textDecoration: clockBInfo.label === 'RESET TO NOW' ? 'underline' : 'none'
                }}
              >
                {clockBInfo.label}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isOffline 
            ? '⚠️ Rig selected is offline. Scheduler access disabled.' 
            : '💡 Click directly on Clock B ticks to select a start time slot.'
          }
        </p>
      </div>

      {/* Booking Form Options */}
      {isOffline ? (
        <div className="glass" style={{ 
          padding: '2.5rem 1.5rem', 
          borderRadius: 'var(--radius-sm)', 
          textAlign: 'center', 
          border: '1px dashed #ff3b30', 
          background: 'rgba(255, 59, 48, 0.02)',
          marginTop: '1rem'
        }}>
          <Gamepad2 size={32} style={{ color: '#ff3b30', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 className="mono" style={{ fontSize: '0.9rem', color: '#ff3b30', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Rig Node Offline
          </h3>
          <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
            This station is currently undergoing system configuration or routine server maintenance. Please select another active rig pod.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Mobile Start Time Selector Dropdown */}
            <div>
              <label className="form-label" htmlFor="reserve-start-time-dropdown">
                <Calendar size={10} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} />
                Select Start Time Slot
              </label>
              <select
                id="reserve-start-time-dropdown"
                className="form-input mono-input"
                value={selectedStart}
                onChange={(e) => setSelectedStart(e.target.value)}
                style={{ padding: '0.8rem 1.25rem', background: '#050505', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="now" disabled={!!activeBooking} style={{ color: '#34c759' }}>Immediate (Now)</option>
                {timeSlots.map((slot) => {
                  const slotStart = slot.date;
                  const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
                  const overlap = checkTimeOverlap(slotStart, slotEnd);
                  return (
                    <option 
                      key={slot.value} 
                      value={slot.value}
                      disabled={overlap.isReserved}
                      style={{ color: overlap.isReserved ? '#ff3b30' : 'var(--text-primary)' }}
                    >
                      {slot.label} {overlap.isReserved ? '(Reserved / Busy)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Time Slider (Controls Duration) */}
            <div>
              <label className="form-label">
                <Calendar size={10} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} />
                Configure Playtime Length
              </label>
              <div className="duration-slider-wrapper" style={{ margin: '0 auto', width: '100%', maxWidth: 'none' }}>
                <button 
                  onClick={decrementTime} 
                  disabled={duration <= minTime || !!activeBooking}
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
                  disabled={!!activeBooking}
                  className="custom-range-slider"
                />
                <button 
                  onClick={incrementTime} 
                  disabled={duration >= 480 || !!activeBooking}
                  className="slider-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Account selection toggle */}
            <div>
              <h3 className="card-subtitle">Credential Privilege</h3>
              <div className="account-selector" style={{ marginTop: '0.5rem' }}>
                <div 
                  className={`account-option ${accountType === 'own' ? 'selected' : ''}`}
                  onClick={() => !activeBooking && setAccountType('own')}
                >
                  <div className="option-title">User Account</div>
                  <div className="option-desc">Connect using personal PlayStation Network credentials.</div>
                </div>
                <div 
                  className={`account-option ${accountType === 'gamezone' ? 'selected' : ''}`}
                  onClick={() => !activeBooking && setAccountType('gamezone')}
                >
                  <div className="option-title">Arena Account</div>
                  <div className="option-desc">Play instantly using pre-loaded games on local admin account.</div>
                </div>
              </div>
            </div>

          </div>

          {/* Timeline Reservation Summary Row */}
          <div className="booking-summary-row" style={{ marginTop: '2.5rem' }}>
            <div className="summary-info-wrapper">
              <div className="summary-price-container">
                <span className="summary-price-label">Reserve Start</span>
                <span className="mono" style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '500', display: 'block' }}>
                  {selectedStart === 'now' 
                    ? 'IMMEDIATE' 
                    : new Date(selectedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                  }
                </span>
              </div>

              <div className="summary-price-container est-finish-container">
                <span className="summary-price-label">Est. Finish</span>
                <span className="mono" style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '500', display: 'block' }}>
                  {currentPreview.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>

              <div className="summary-price-container estimated-rate-container">
                <span className="summary-price-label">Estimated Rate</span>
                <span className="summary-price" style={{ fontSize: '1.75rem', marginTop: '0' }}>₹{totalPrice}</span>
              </div>
            </div>

            <button 
              onClick={handleBook} 
              disabled={!!activeBooking}
              className="btn-primary"
            >
              {activeBooking 
                ? 'Session Engaged' 
                : selectedStart === 'now' 
                  ? 'Book Station' 
                  : 'Reserve Slot'
              } 
              <Check size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
