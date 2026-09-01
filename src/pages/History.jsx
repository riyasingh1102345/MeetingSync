import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, Users, ArrowRight, Video, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const font = "'Plus Jakarta Sans', sans-serif";

export default function History() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'meetings'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.seconds || 0;
            const tb = b.createdAt?.seconds || 0;
            return tb - ta;
          });
        setHistory(fetched);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [currentUser]);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent card click
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await deleteDoc(doc(db, 'meetings', id));
      setHistory(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      alert('Failed to delete meeting');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>Loading history...</div>;
  }

  return (
    <div style={{ fontFamily: font, height: '100%', width: '100%', background: '#F4F7F9', padding: '48px 56px', overflowY: 'auto' }}>
      
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
          <HistoryIcon size={28} color="#2563EB" /> Meeting History
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', marginTop: 8 }}>
          A chronological timeline of all your past meetings and recordings.
        </p>
      </div>

      {history.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '60px', border: '1px solid #E2E8F0', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <HistoryIcon size={40} color="#94A3B8" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>No History Yet</h2>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.5 }}>
            You haven't attended or recorded any meetings in the past. Once you start participating in meetings, your history will appear here.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', maxWidth: 800 }}>
          {/* Timeline Line */}
          <div style={{ position: 'absolute', top: 20, bottom: 0, left: 15, width: 2, background: '#E2E8F0', zIndex: 0 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {history.map((meeting) => (
              <div key={meeting.id} style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
                
                {/* Timeline Dot */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '4px solid #2563EB', flexShrink: 0, marginTop: 12 }} />

                {/* Card */}
                <div 
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                  style={{ 
                    flex: 1, background: '#FFFFFF', borderRadius: 20, padding: 24, border: '1px solid #E2E8F0', 
                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{meeting.title || 'Untitled Meeting'}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {meeting.date} at {meeting.time}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {meeting.attendees} Attendees</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Video size={14} /> Hosted by {meeting.host}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div 
                        onClick={(e) => handleDelete(e, meeting.id)}
                        style={{ width: 36, height: 36, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FECACA'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FEE2E2'}
                      >
                        <Trash2 size={18} />
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {meeting.summary}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
