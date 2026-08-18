import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const font = "'Plus Jakarta Sans', sans-serif";

export default function LiveMeeting() {
  const { currentUser } = useAuth();
  const jitsiContainer = useRef(null);
  const apiRef = useRef(null);

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
  const roomName = `MeetingSync-${currentUser?.uid?.slice(0, 8) || 'demo'}-${Date.now().toString(36)}`;

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: {
        displayName,
        email: currentUser?.email || '',
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'participants-pane',
          'chat', 'tileview', 'hangup', 'raisehand', 'recording',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#090E17',
        BRAND_WATERMARK_LINK: '',
        NATIVE_APP_NAME: 'MeetingSync',
      },
    };

    // Load Jitsi script if not already present
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      };
      document.head.appendChild(script);
    } else {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  return (
    <div style={{ fontFamily: font, display: 'flex', flexDirection: 'column', height: '100vh', background: '#090E17' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>Live Meeting</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Room: {roomName}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
          <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Jitsi Embed */}
      <div ref={jitsiContainer} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
}
