import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const font = "'Plus Jakarta Sans', sans-serif";

export default function LiveMeeting() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);
  const apiRef = useRef(null);

  // Track participants who join the meeting (key = participantId, value = name)
  const [participants, setParticipants] = useState({});
  const [meetingStartTime] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // Get the logged-in user's display name (this will be the host)
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
  const roomName = `MeetLens-${currentUser?.uid?.slice(0, 8) || 'demo'}-${Date.now().toString(36)}`;

  // Save meeting data to Firestore when the meeting ends
  const saveMeetingToFirestore = async (participantMap) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const endTime = new Date();
      const durationMs = endTime - meetingStartTime;
      const durationMins = Math.round(durationMs / 60000);
      const durationStr = durationMins < 1 ? 'Less than 1 min' : `${durationMins} min`;

      // Build the list of unique participant names (including the host)
      const allParticipants = { host: displayName, ...participantMap };
      const uniqueNames = [...new Set(Object.values(allParticipants))];
      const attendeeCount = uniqueNames.length;

      // Build speakerNames map for Analytics page compatibility
      const speakerNames = {};
      uniqueNames.forEach((name, i) => {
        const letter = String.fromCharCode(65 + i);
        speakerNames[`Speaker ${letter}`] = name;
      });

      await addDoc(collection(db, 'meetings'), {
        userId: currentUser.uid,
        title: `Live Meeting — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: meetingStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: durationStr,
        host: displayName,
        attendees: attendeeCount,
        attendeeCount: attendeeCount,
        speakerNames: speakerNames,
        participantNames: uniqueNames,
        tags: ['Live Meeting'],
        color: '#10B981',
        letter: 'L',
        summary: `Live meeting hosted by ${displayName} with ${attendeeCount} participant(s). Duration: ${durationStr}.`,
        actionItems: [],
        chapters: [],
        transcript: [],
        transcriptText: '',
        createdAt: serverTimestamp(),
      });

      console.log('✅ Live meeting saved to Firestore!');
      navigate('/history');
    } catch (err) {
      console.error('❌ Failed to save meeting:', err);
      navigate('/dashboard');
    }
  };

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
        NATIVE_APP_NAME: 'MeetLens AI',
      },
    };

    const initJitsi = () => {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      // Track when a new participant joins
      api.addEventListener('participantJoined', (event) => {
        const { id, displayName: name } = event;
        console.log(`👤 Participant joined: ${name}`);
        setParticipants(prev => ({ ...prev, [id]: name || 'Guest' }));
      });

      // Track when a participant leaves
      api.addEventListener('participantLeft', (event) => {
        console.log(`👋 Participant left: ${event.id}`);
        // We keep them in the list so we have a full record
      });

      // When the meeting ends (user clicks Hangup), save data to Firestore
      api.addEventListener('readyToClose', () => {
        console.log('📞 Meeting ended. Saving participant data...');
        // Get final participant list before saving
        setParticipants(prev => {
          saveMeetingToFirestore(prev);
          return prev;
        });
      });
    };

    // Load Jitsi script if not already present
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      document.head.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  const participantCount = Object.keys(participants).length + 1; // +1 for the host

  return (
    <div style={{ fontFamily: font, display: 'flex', flexDirection: 'column', height: '100vh', background: '#090E17' }}>
      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>Live Meeting</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Host: {displayName}</div>
        </div>

        {/* Participant count badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <Users size={14} color="#9CA3AF" />
            <span style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 600 }}>{participantCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
            <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Jitsi Embed */}
      <div ref={jitsiContainer} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
}
