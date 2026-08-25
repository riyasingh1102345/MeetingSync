import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, Loader2, Video, StopCircle, Radio } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const font = "'Plus Jakarta Sans', sans-serif";
const CLOUDINARY_CLOUD_NAME = 'dkcea1x5';
const CLOUDINARY_UPLOAD_PRESET = 'meetingsync_preset';
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function LiveMeeting() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const jitsiContainer = useRef(null);
  const apiRef = useRef(null);

  // Recording states
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processStep, setProcessStep] = useState(null); // 'uploading', 'transcribing', 'summarizing', 'saving'
  const [processError, setProcessError] = useState(null);

  // Participant tracking
  const [currentParticipants, setCurrentParticipants] = useState({});
  const [allTimeParticipants, setAllTimeParticipants] = useState({});
  const [participantCount, setParticipantCount] = useState(1);
  const [meetingStartTime] = useState(new Date());

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
  
  // Memoize roomName so it doesn't change on re-renders
  const roomNameRef = useRef(`MeetLens-${currentUser?.uid?.slice(0, 8) || 'demo'}-${Date.now().toString(36)}`);
  const roomName = roomNameRef.current;
  
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://8x8.vc/${roomName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Recording Logic ──
  const startRecording = async () => {
    try {
      // Prompt user to select a screen to record (must include audio)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        // Stop all tracks to release camera/mic
        stream.getTracks().forEach(track => track.stop());
        await processAndSaveMeeting(blob);
      };

      // Detect if user clicks "Stop Sharing" on the browser native UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Failed to start recording. Please make sure you share the tab audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ── Process & Save Logic ──
  const processAndSaveMeeting = async (videoBlob) => {
    setProcessStep('uploading');
    let cloudinaryUrl = '';

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', videoBlob, 'live_meeting.webm');
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData
      });

      if (!cloudinaryRes.ok) throw new Error('Cloudinary upload failed');
      const cloudinaryData = await cloudinaryRes.json();
      cloudinaryUrl = cloudinaryData.secure_url;

      // 2. Process with Backend AI
      setProcessStep('transcribing');
      const processRes = await fetch(`${SERVER_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: cloudinaryUrl }),
      });

      if (!processRes.ok) {
        let errMessage = 'AI processing failed';
        try {
          const errData = await processRes.json();
          errMessage = errData.error || errMessage;
        } catch (parseErr) {
          errMessage = `Server error (${processRes.status}): Backend may be sleeping or unreachable.`;
        }
        throw new Error(errMessage);
      }
      setProcessStep('summarizing');
      const aiData = await processRes.json();

      // 3. Merge AI data with live participant data and save to Firestore
      setProcessStep('saving');
      
      const endTime = new Date();
      const durationMs = endTime - meetingStartTime;
      const durationMins = Math.round(durationMs / 60000);
      const durationStr = durationMins < 1 ? 'Less than 1 min' : `${durationMins} min`;

      // Build unique participant list (using allTimeParticipants so we don't miss people who left early)
      const allParticipantsObj = { host: displayName, ...allTimeParticipants };
      const uniqueNames = [...new Set(Object.values(allParticipantsObj))];
      const actualCount = uniqueNames.length;

      // Merge real names with AI speaker labels
      const speakerNames = aiData.speakerNames || {};
      uniqueNames.forEach((name, i) => {
        const letter = String.fromCharCode(65 + i);
        if (!speakerNames[`Speaker ${letter}`]) {
          speakerNames[`Speaker ${letter}`] = name;
        }
      });

      const docRef = await addDoc(collection(db, 'meetings'), {
        userId: currentUser.uid,
        title: `Live Meeting — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: meetingStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: durationStr,
        host: displayName,
        attendees: actualCount,
        attendeeCount: actualCount,
        speakerNames: speakerNames,
        participantNames: uniqueNames,
        tags: ['Live Recording', 'AI Processed'],
        color: '#10B981',
        letter: 'L',
        videoUrl: cloudinaryUrl,
        transcript: aiData.transcriptLines || [],
        transcriptText: aiData.transcriptText || '',
        chapters: aiData.chapters || [],
        summary: aiData.summary || `Live meeting hosted by ${displayName}.`,
        actionItems: aiData.actionItems || [],
        createdAt: serverTimestamp(),
      });

      navigate(`/meeting/${docRef.id}`);

    } catch (err) {
      console.error(err);
      setProcessError(err.message);
    }
  };

  // ── Jitsi Setup ──
  useEffect(() => {
    const domain = '8x8.vc';
    const options = {
      roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.current,
      userInfo: { displayName, email: currentUser?.email || '' },
      configOverwrite: {
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        enableLobbyChat: false,
        hideLobbyButton: true,
        disableLobby: true,
        enableInsecureRoomNameWarning: false,
        requireDisplayName: false,
        lobbyEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'participants-pane',
          'chat', 'tileview', 'hangup', 'raisehand'
        ],
        SHOW_JITSI_WATERMARK: false,
        DEFAULT_BACKGROUND: '#090E17',
      },
    };

    const initJitsi = () => {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      const updateParticipants = () => {
        // Use Jitsi's native counter which correctly handles hidden bots/guests
        const realCount = api.getNumberOfParticipants();
        setParticipantCount(realCount > 0 ? realCount : 1);

        const peers = api.getParticipantsInfo();
        const peerMap = {};
        peers.forEach(p => {
          if (p.formattedDisplayName && !p.hidden) {
            peerMap[p.participantId] = p.formattedDisplayName;
          }
        });
        
        // Update current participants (for the badge)
        setCurrentParticipants(peerMap);
        
        // Add to all-time participants (for the Firestore save)
        setAllTimeParticipants(prev => ({ ...prev, ...peerMap }));
      };

      api.addEventListener('participantJoined', updateParticipants);
      api.addEventListener('participantLeft', updateParticipants);
      api.addEventListener('displayNameChange', updateParticipants);
      api.addEventListener('readyToClose', async () => {
        // If recording is active when user hangs up, stop recording (which triggers upload and save)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        } else if (!processStep) {
          // If no recording was active, save basic meeting data and go to history
          try {
            const endTime = new Date();
            const durationMs = endTime - meetingStartTime;
            const durationMins = Math.round(durationMs / 60000);
            const durationStr = durationMins < 1 ? 'Less than 1 min' : `${durationMins} min`;

            const allParticipantsObj = { host: displayName, ...allTimeParticipants };
            const uniqueNames = [...new Set(Object.values(allParticipantsObj))];
            const actualCount = uniqueNames.length;
            
            const speakerNames = {};
            uniqueNames.forEach((name, i) => {
              speakerNames[`Speaker ${String.fromCharCode(65 + i)}`] = name;
            });

            await addDoc(collection(db, 'meetings'), {
              userId: currentUser.uid,
              title: `Live Meeting — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: meetingStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              duration: durationStr,
              host: displayName,
              attendees: actualCount,
              attendeeCount: actualCount,
              speakerNames: speakerNames,
              participantNames: uniqueNames,
              tags: ['Live Meeting'],
              color: '#10B981',
              letter: 'L',
              summary: `Live meeting hosted by ${displayName} with ${actualCount} participant(s). Duration: ${durationStr}. (Not Recorded)`,
              actionItems: [],
              chapters: [],
              transcript: [],
              transcriptText: '',
              createdAt: serverTimestamp(),
            });
          } catch (err) {
            console.error('Failed to save unrecorded meeting:', err);
          }
          navigate('/history');
        }
      });
    };

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
      if (apiRef.current) apiRef.current.dispose();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── UI Overlay for Processing ──
  if (processStep) {
    const stepMessages = {
      uploading: 'Uploading recording to cloud...',
      transcribing: 'AI is transcribing audio...',
      summarizing: 'Generating smart summary & action items...',
      saving: 'Saving to your workspace...'
    };

    return (
      <div style={{ fontFamily: font, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090E17', color: '#FFF' }}>
        {processError ? (
          <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '40px', borderRadius: 20, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ color: '#EF4444', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Processing Failed</div>
            <p style={{ color: '#FCA5A5', fontSize: 14 }}>{processError}</p>
            <Link to="/dashboard" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: '#EF4444', color: '#FFF', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Back to Dashboard</Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 32px' }}>
              <Loader2 size={80} color="#3B82F6" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }} />
              <Loader2 size={80} color="#3B82F6" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, animationDuration: '2s' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Processing Live Meeting</h2>
            <div style={{ fontSize: 15, color: '#94A3B8', fontWeight: 500, padding: '16px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              {stepMessages[processStep]}
            </div>
            <p style={{ marginTop: 24, fontSize: 13, color: '#64748B' }}>Please do not close this tab. This may take a few minutes depending on the meeting length.</p>
          </div>
        )}
      </div>
    );
  }

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

        {/* Copy Meeting Link */}
        <button
          onClick={handleCopyLink}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
            color: copied ? '#10B981' : '#60A5FA',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginLeft: 20
          }}
        >
          {copied ? '✓ Link Copied!' : '🔗 Copy Meeting Link'}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Record Button */}
          {!isRecording ? (
            <button onClick={startRecording} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#EF4444', color: '#FFF', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
              <Radio size={16} /> Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'transparent', color: '#EF4444', borderRadius: 8, border: '1px solid #EF4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', animation: 'pulse 2s infinite' }}>
              <StopCircle size={16} /> Stop Recording
            </button>
          )}
          
          <style>{`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(239,68,68, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(239,68,68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239,68,68, 0); }
            }
          `}</style>

          {/* Participant count */}
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
