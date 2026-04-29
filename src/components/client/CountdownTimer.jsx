import React, { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);
  const expiredTriggered = useRef(false);
  
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { 
        setRemaining("0:00"); 
        setUrgent(true); 
        if (!expiredTriggered.current && onExpire) {
          expiredTriggered.current = true;
          onExpire();
        }
        return; 
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
      setUrgent(diff < 120000);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      margin: '20px 0 10px' 
    }}>
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 8, 
        padding: '8px 16px', 
        borderRadius: 20, 
        background: urgent ? '#fff1f0' : '#f8fafc',
        border: `1px solid ${urgent ? '#ffa39e' : '#e2e8f0'}`,
        color: urgent ? '#cf1322' : '#64748b',
        boxShadow: urgent ? '0 4px 12px rgba(245, 34, 45, 0.1)' : 'none'
      }}>
        <Clock className={`w-4 h-4 ${urgent ? 'animate-pulse' : ''}`} />
        <span style={{ 
          fontSize: '0.9rem', 
          fontWeight: 800, 
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          letterSpacing: '0.05em'
        }}>
          {remaining}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8 }}>restantes</span>
      </div>
    </div>
  );
}
