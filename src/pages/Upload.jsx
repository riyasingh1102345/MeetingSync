import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, Link as LinkIcon, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const C = {
  blue: '#2563EB',
  blueHover: '#1D4ED8',
  blueLight: '#EFF6FF',
  blueBorder: '#DBEAFE',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  bg: '#FFFFFF',
  bgWarm: '#F8FAFC',
  success: '#10B981',
  successLight: '#ECFDF5',
  error: '#EF4444',
  errorLight: '#FEF2F2',
};

const font = "'Plus Jakarta Sans', sans-serif";

const CLOUDINARY_CLOUD_NAME = 'dkcea1x5';
const CLOUDINARY_UPLOAD_PRESET = 'meetingsync_preset';
const SERVER_URL = 'http://localhost:3001';

const STEPS = [
  { id: 'uploading', label: 'Uploading to cloud storage...' },
  { id: 'transcribing', label: 'Transcribing audio with AI...' },
  { id: 'summarizing', label: 'Generating summary & action items...' },
  { id: 'saving', label: 'Saving to your dashboard...' },
];

export default function Upload() {
  const [step, setStep] = useState(null); // null | 'uploading' | 'transcribing' | 'summarizing' | 'saving' | 'done' | 'error'
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleFile = async (file) => {
    if (!currentUser) { alert('Please sign in first.'); return; }
    if (!file) return;

    setErrorMsg('');

    // ── Step 1: Upload to Cloudinary ──────────────────────────────────
    setStep('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    let cloudinaryUrl;
    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            cloudinaryUrl = data.secure_url;
            resolve();
          } else {
            reject(new Error('Cloudinary upload failed: ' + xhr.responseText));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`);
        xhr.send(formData);
      });
    } catch (err) {
      setStep('error');
      setErrorMsg(err.message);
      return;
    }

    // ── Step 2: Send to our server for AI processing ──────────────────
    setStep('transcribing');
    setProgress(0);

    try {
      const response = await fetch(`${SERVER_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: cloudinaryUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server processing failed.');
      }

      setStep('summarizing');
      const aiData = await response.json();

      // ── Step 3: Save to Firestore ───────────────────────────────────
      setStep('saving');
      const docRef = await addDoc(collection(db, 'meetings'), {
        userId: currentUser.uid,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        duration: 'Processing...',
        attendees: aiData.attendeeCount || 1,
        host: aiData.host || 'Unknown',
        tags: ['AI Processed'],
        color: C.blue,
        letter: file.name.charAt(0).toUpperCase(),
        videoUrl: cloudinaryUrl,
        transcript: aiData.transcriptLines,
        transcriptText: aiData.transcriptText,
        chapters: aiData.chapters || [],
        summary: aiData.summary,
        actionItems: aiData.actionItems,
        createdAt: serverTimestamp(),
      });

      setStep('done');
      setTimeout(() => navigate(`/meeting/${docRef.id}`), 2000);
    } catch (err) {
      setStep('error');
      setErrorMsg(err.message);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (step && step !== null) {
    return (
      <div style={{ fontFamily: font, padding: '80px 48px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        {step === 'error' ? (
          <>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: C.errorLight, color: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertCircle size={40} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: C.error, marginBottom: 32, background: C.errorLight, padding: '12px 20px', borderRadius: 12 }}>{errorMsg}</p>
            <button
              onClick={() => { setStep(null); setProgress(0); setErrorMsg(''); }}
              style={{ background: C.blue, color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Try Again
            </button>
          </>
        ) : step === 'done' ? (
          <>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: C.successLight, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={40} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary, marginBottom: 8 }}>Meeting processed! 🎉</h2>
            <p style={{ fontSize: 15, color: C.textSecondary }}>Redirecting you to the dashboard...</p>
          </>
        ) : (
          <>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CloudUpload size={40} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary, marginBottom: 8 }}>Processing your meeting...</h2>
            <p style={{ fontSize: 15, color: C.textSecondary, marginBottom: 40 }}>Our AI is extracting transcripts, summaries, and action items. This may take 1-2 minutes.</p>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, textAlign: 'left' }}>
              {STEPS.map((s) => {
                const currentIndex = STEPS.findIndex(x => x.id === step);
                const thisIndex = STEPS.findIndex(x => x.id === s.id);
                const isDone = thisIndex < currentIndex;
                const isActive = s.id === step;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: isActive ? C.blueLight : isDone ? C.successLight : C.bgWarm, border: `1px solid ${isActive ? C.blueBorder : isDone ? '#A7F3D0' : C.border}` }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: isActive ? C.blue : isDone ? C.success : C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDone ? <CheckCircle2 size={14} color="white" strokeWidth={3}/> : isActive ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} /> : null}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? C.blue : isDone ? C.success : C.textMuted }}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {step === 'uploading' && (
              <>
                <div style={{ width: '100%', height: 8, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: C.blue, transition: 'width 0.3s ease-out' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: C.blue }}>{progress}%</div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font, padding: '40px 48px', maxWidth: 900, margin: '0 auto', color: C.textPrimary }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Upload a Meeting</h1>
        <p style={{ fontSize: 14.5, color: C.textSecondary }}>Add audio or video and let our AI do the rest — transcripts, summaries, and action items.</p>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{
          background: dragOver ? C.blueLight : 'white',
          border: `2px dashed ${dragOver ? C.blue : C.blueBorder}`,
          borderRadius: 20,
          padding: '56px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(37,99,235,0.03)',
        }}
        onMouseEnter={e => { if (!dragOver) { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = C.blueLight; }}}
        onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = C.blueBorder; e.currentTarget.style.background = 'white'; }}}
      >
        <input ref={fileInputRef} type="file" accept="video/*,audio/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        <div style={{ width: 64, height: 64, borderRadius: 16, background: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CloudUpload size={32} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Drop your file here</div>
        <div style={{ fontSize: 14.5, color: C.textSecondary, marginBottom: 24 }}>or click to browse files</div>
        <button style={{
          background: C.blue, color: 'white', padding: '12px 28px', borderRadius: 10,
          fontSize: 14.5, fontWeight: 700, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
        }}>
          Choose File
        </button>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 24, fontWeight: 500 }}>
          Supports MP3, MP4, WAV, M4A · Powered by AssemblyAI + Gemini
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '36px 0' }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 12.5, color: C.textMuted, fontWeight: 600, letterSpacing: '0.05em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Link Import */}
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <LinkIcon size={16} color={C.textMuted} />
          Import from link
        </div>
        <div style={{ fontSize: 13.5, color: C.textSecondary, marginBottom: 20 }}>
          Paste a YouTube, Google Drive, or direct video link
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            id="link-import-input"
            style={{
              flex: 1, height: 44, border: `1.5px solid ${C.border}`, borderRadius: 10,
              padding: '0 16px', fontSize: 14, outline: 'none', background: C.bgWarm,
              fontFamily: font, transition: 'border-color 0.2s'
            }}
            placeholder="https://..."
            onFocus={e => e.currentTarget.style.borderColor = C.blue}
            onBlur={e => e.currentTarget.style.borderColor = C.border}
          />
          <button
            onClick={() => {
              const url = document.getElementById('link-import-input').value;
              if (url) handleFile({ name: 'Link Import', fromUrl: url });
            }}
            style={{
              background: C.textPrimary, color: 'white', border: 'none', borderRadius: 10,
              padding: '0 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: font,
            }}>
            Import
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40, fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
        <Shield size={14} /> All uploads are encrypted and private to your account.
      </div>
    </div>
  );
}
