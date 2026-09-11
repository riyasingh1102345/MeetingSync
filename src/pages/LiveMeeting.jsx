import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Users, Loader2, Video, VideoOff, Mic, MicOff, 
  Monitor, PhoneOff, Radio, StopCircle, Copy, Check, Shield, Sparkles
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, doc, setDoc, getDoc, updateDoc, onSnapshot, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';

const font = "'Plus Jakarta Sans', sans-serif";
const CLOUDINARY_CLOUD_NAME = 'dkcea1x5';
const CLOUDINARY_UPLOAD_PRESET = 'meetingsync_preset';
const SERVER_URL = import.meta.env.VITE_API_URL || 'https://meetingsync-server.onrender.com';

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ]
};

export default function LiveMeeting() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);

  // Meeting Room Info
  const roomParam = searchParams.get('room');
  const [roomId] = useState(roomParam || `room-${currentUser?.uid?.slice(0, 6) || 'demo'}-${Date.now().toString(36)}`);
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Attendee';

  // State
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [hasRemoteUser, setHasRemoteUser] = useState(false);
  const [participants, setParticipants] = useState([displayName]);
  const [copied, setCopied] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processStep, setProcessStep] = useState(null); // 'uploading' | 'transcribing' | 'summarizing' | 'saving'
  const [processError, setProcessError] = useState(null);
  const timerRef = useRef(null);
  const meetingStartTimeRef = useRef(new Date());

  // ── 1. Initialize Local Video Stream & WebRTC ──
  useEffect(() => {
    let unsubscribeRoom = null;

    async function setupRoom() {
      try {
        // Acquire camera and mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize PeerConnection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Push local tracks into connection
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Listen for remote peer tracks
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
            setHasRemoteUser(true);
          }
        };

        // Firestore Signaling
        const roomDocRef = doc(db, 'meetingRooms', roomId);
        const roomSnapshot = await getDoc(roomDocRef);

        if (!roomSnapshot.exists()) {
          // Host creates room and offer
          pc.onicecandidate = async (e) => {
            if (e.candidate) {
              await addDoc(collection(roomDocRef, 'offerCandidates'), e.candidate.toJSON());
            }
          };

          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          await setDoc(roomDocRef, {
            offer: { sdp: offerDescription.sdp, type: offerDescription.type },
            host: displayName,
            hostId: currentUser?.uid || 'guest',
            participants: [displayName],
            createdAt: serverTimestamp()
          });

          // Listen for answer from peer
          unsubscribeRoom = onSnapshot(roomDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              pc.setRemoteDescription(answerDescription);
            }
            if (data?.participants) {
              setParticipants(data.participants);
            }
          });

          // Listen for answer candidates
          onSnapshot(collection(roomDocRef, 'answerCandidates'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });

        } else {
          // Peer joins room and creates answer
          const roomData = roomSnapshot.data();
          if (roomData.participants && !roomData.participants.includes(displayName)) {
            await updateDoc(roomDocRef, {
              participants: [...roomData.participants, displayName]
            });
          }

          pc.onicecandidate = async (e) => {
            if (e.candidate) {
              await addDoc(collection(roomDocRef, 'answerCandidates'), e.candidate.toJSON());
            }
          };

          const offerDescription = roomData.offer;
          await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);

          await updateDoc(roomDocRef, {
            answer: { type: answerDescription.type, sdp: answerDescription.sdp }
          });

          // Listen for offer candidates
          onSnapshot(collection(roomDocRef, 'offerCandidates'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
              }
            });
          });

          // Listen for participant updates
          unsubscribeRoom = onSnapshot(roomDocRef, (snapshot) => {
            const data = snapshot.data();
            if (data?.participants) {
              setParticipants(data.participants);
            }
          });
        }

      } catch (err) {
        console.error('Error establishing custom WebRTC meeting:', err);
      }
    }

    setupRoom();

    return () => {
      if (unsubscribeRoom) unsubscribeRoom();
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  // ── Media Controls ──
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach(t => { t.enabled = !micEnabled; });
    setMicEnabled(!micEnabled);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach(t => { t.enabled = !cameraEnabled; });
    setCameraEnabled(!cameraEnabled);
  };

  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsSharingScreen(true);
      } catch (err) {
        console.error('Screen sharing cancelled or failed:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (!localStreamRef.current) return;
    const camTrack = localStreamRef.current.getVideoTracks()[0];
    if (pcRef.current && camTrack) {
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) videoSender.replaceTrack(camTrack);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsSharingScreen(false);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/live?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Recording & AI Processing ──
  const startRecording = () => {
    if (!localStreamRef.current) return;

    try {
      recordingChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(localStreamRef.current, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start native recording:', err);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!mediaRecorderRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
      await processRecordedMeeting(blob);
    };

    mediaRecorderRef.current.stop();
  };

  const processRecordedMeeting = async (blob) => {
    try {
      // Step 1: Upload to Cloudinary
      setProcessStep('uploading');
      const formData = new FormData();
      formData.append('file', blob, `live_meeting_${Date.now()}.webm`);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: formData
      });

      if (!cloudinaryRes.ok) throw new Error('Cloudinary upload failed');
      const cloudinaryData = await cloudinaryRes.json();
      const cloudinaryUrl = cloudinaryData.secure_url;

      // Step 2: Backend AI Pipeline with Real Speakers & Minute-by-Minute
      setProcessStep('transcribing');
      const processRes = await fetch(`${SERVER_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: cloudinaryUrl,
          participants: participants
        })
      });

      if (!processRes.ok) {
        throw new Error('AI processing failed on backend');
      }

      setProcessStep('summarizing');
      const aiData = await processRes.json();

      // Step 3: Save to Firestore
      setProcessStep('saving');
      const durationMins = Math.max(1, Math.round(recordingTime / 60));
      const docRef = await addDoc(collection(db, 'meetings'), {
        userId: currentUser?.uid || 'guest',
        title: `Live Meeting — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: meetingStartTimeRef.current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: `${durationMins} min`,
        host: displayName,
        attendees: participants.length,
        attendeeCount: participants.length,
        speakerNames: aiData.speakerNames || {},
        participantNames: participants,
        tags: ['In-Built Live Meeting', 'AI Processed'],
        color: '#2563EB',
        letter: 'M',
        videoUrl: cloudinaryUrl,
        transcript: aiData.transcriptLines || [],
        transcriptText: aiData.transcriptText || '',
        chapters: aiData.chapters || [],
        minuteByMinute: aiData.minuteByMinute || [],
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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ── Processing Loading Screen ──
  if (processStep) {
    const stepMessages = {
      uploading: 'Uploading HD recording to cloud storage...',
      transcribing: 'AI is transcribing voices with speaker diarization...',
      summarizing: 'Generating minute-by-minute breakdown & action items...',
      saving: 'Saving to your MeetLens workspace...'
    };

    return (
      <div style={{ fontFamily: font, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090E17', color: '#FFF' }}>
        {processError ? (
          <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '40px', borderRadius: 20, border: '1px solid rgba(239, 68, 68, 0.2)', maxWidth: 450 }}>
            <div style={{ color: '#EF4444', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Processing Failed</div>
            <p style={{ color: '#FCA5A5', fontSize: 14, marginBottom: 20 }}>{processError}</p>
            <Link to="/dashboard" style={{ display: 'inline-block', padding: '10px 24px', background: '#EF4444', color: '#FFF', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Back to Dashboard</Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center', maxWidth: 450, padding: 32 }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
              <Loader2 size={80} color="#3B82F6" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }} />
              <Loader2 size={80} color="#3B82F6" className="animate-spin" style={{ position: 'absolute', top: 0, left: 0, animationDuration: '1.8s' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>MeetLens AI Intelligence Engine</h2>
            <div style={{ fontSize: 14.5, color: '#93C5FD', fontWeight: 600, padding: '14px 20px', background: 'rgba(59,130,246,0.1)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.25)' }}>
              {stepMessages[processStep]}
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: '#64748B' }}>Identifying real speakers and compiling timestamped minute-by-minute breakdown.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font, display: 'flex', flexDirection: 'column', height: '100vh', background: '#090E17', color: '#FFF', overflow: 'hidden' }}>
      
      {/* ── Top Navigation Bar ── */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0D1424', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#94A3B8', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
              MeetLens In-Built Room
              <span style={{ fontSize: 11, background: 'rgba(37,99,235,0.2)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.4)', borderRadius: 12, padding: '2px 8px', fontWeight: 700 }}>
                100% Proprietary WebRTC
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Room: {roomId.slice(0, 16)}...</div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Copy Invite Link */}
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              color: copied ? '#10B981' : '#E2E8F0',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : '#1E293B'}`,
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Link Copied!' : 'Invite Participants'}
          </button>

          {/* Recording Timer Badge */}
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, color: '#EF4444', fontWeight: 800, fontSize: 12.5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
              REC {formatTimer(recordingTime)}
            </div>
          )}

          {/* Participants Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: '#94A3B8' }}>
            <Users size={14} color="#60A5FA" />
            <span>{participants.length}</span>
          </div>
        </div>
      </div>

      {/* ── Main Video Grid Canvas ── */}
      <div style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: hasRemoteUser ? '1fr 1fr' : '1fr', gap: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        
        {/* Local Video Card */}
        <div style={{ position: 'relative', width: '100%', height: '100%', maxHeight: 'calc(100vh - 170px)', background: '#111827', borderRadius: 20, overflow: 'hidden', border: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isSharingScreen ? 'none' : 'scaleX(-1)' }}
          />

          {!cameraEnabled && !isSharingScreen && (
            <div style={{ position: 'absolute', inset: 0, background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>Camera is turned off</span>
            </div>
          )}

          {/* Local Name Badge */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{displayName} (You)</span>
            {!micEnabled && <MicOff size={13} color="#EF4444" />}
          </div>
        </div>

        {/* Remote Video Card (if 2nd peer joined) */}
        {hasRemoteUser ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', maxHeight: 'calc(100vh - 170px)', background: '#111827', borderRadius: 20, overflow: 'hidden', border: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                {participants.find(p => p !== displayName) || 'Participant'}
              </span>
            </div>
          </div>
        ) : (
          null
        )}
      </div>

      {/* ── Bottom Floating Control Toolbar ── */}
      <div style={{ height: 80, borderTop: '1px solid #1E293B', background: '#0D1424', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', flexShrink: 0 }}>
        
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            background: micEnabled ? '#1E293B' : '#EF4444',
            color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            background: cameraEnabled ? '#1E293B' : '#EF4444',
            color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            background: isSharingScreen ? '#2563EB' : '#1E293B',
            color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          title={isSharingScreen ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <Monitor size={20} />
        </button>

        {/* AI Recording Start / Stop Button */}
        {!isRecording ? (
          <button
            onClick={startRecording}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 99,
              background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.4)', transition: 'background 0.15s'
            }}
          >
            <Radio size={16} /> Start AI Recording
          </button>
        ) : (
          <button
            onClick={stopRecordingAndProcess}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 99,
              background: '#EF4444', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.4)', transition: 'background 0.15s'
            }}
          >
            <StopCircle size={16} /> End & Analyze Meeting
          </button>
        )}

        {/* Leave / Close Meeting */}
        <button
          onClick={() => {
            if (isRecording) {
              if (window.confirm('Meeting is recording. End and analyze now?')) {
                stopRecordingAndProcess();
              }
            } else {
              navigate('/dashboard');
            }
          }}
          style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none',
            background: 'rgba(239,68,68,0.15)', color: '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'transform 0.15s'
          }}
          title="Leave Meeting"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
