import React from 'react';
import { Phone, MessageSquare, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function ContactLocation() {
  const phoneNumber = '9492906475';
  const whatsappUrl = `https://wa.me/91${phoneNumber}`;
  const mapUrl = 'https://maps.app.goo.gl/yBXN4du2DiS8WqDb6';
  
  return (
    <div className="info-cards-column">
      {/* Contact Details Card */}
      <div className="card glass">
        <div className="card-subtitle">Connect Desk</div>
        <div className="card-title">Live Channels</div>
        
        <div className="contact-list">
          {/* Phone */}
          <div className="contact-item">
            <Phone size={14} className="contact-icon" />
            <div className="contact-details">
              <h4>Audio Link</h4>
              <a href={`tel:${phoneNumber}`} className="mono">
                +91 {phoneNumber}
              </a>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="contact-item">
            <MessageSquare size={14} className="contact-icon" />
            <div className="contact-details">
              <h4>Text Link</h4>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mono">
                WhatsApp Messaging
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="contact-item">
            <Mail size={14} className="contact-icon" />
            <div className="contact-details">
              <h4>Electronic Mail</h4>
              <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                desk@voidgz.com [pending]
              </span>
            </div>
          </div>

          {/* Location Details */}
          <div className="contact-item">
            <MapPin size={14} className="contact-icon" />
            <div className="contact-details">
              <h4>Arena Hours</h4>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                10:00 - 23:00 // Standard daily
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Embed Card */}
      <div className="card glass">
        <div className="card-subtitle">Navigation Core</div>
        <div className="card-title">Location Map</div>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Locate our hardware pods. Real-time interactive GPS track below.
        </p>

        {/* Real Interactive Google Map */}
        <div className="map-container">
          <iframe
            title="Arena Location Map"
            src="https://maps.google.com/maps?q=MVV%20%26%20MK%20Park%20Apartments&t=&z=16&ie=UTF8&iwloc=&output=embed"
            className="dark-map-iframe"
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>

        <a 
          href={mapUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.5rem', textDecoration: 'none', justifyContent: 'center' }}
        >
          Open in Google Maps <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
