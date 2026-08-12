import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  Video, Clock, Calendar as CalendarIcon, Loader2,
  Search, Filter, LayoutGrid, List, VideoOff, UploadCloud, Plus
} from 'lucide-react';

const font = "'Plus Jakarta Sans', sans-serif";
const AV_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

function StackedAvatars({ count, hostInitial }) {
  const total = Math.min(count || 1, 4);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 28, height: 28, borderRadius: '50%',
          background: AV_COLORS[i % AV_COLORS.length],
          border: '2px solid #FFF', marginLeft: i === 0 ? 0 : -8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: '#fff', zIndex: total - i
        }}>
          {i === 0 ? (hostInitial || '?') : String.fromCharCode(65 + i)}
        </div>
      ))}
      {count > 4 && (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginLeft: 6 }}>+{count - 4}</span>
      )}
    </div>
  );
}

export default function Meetings() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    async function fetchMeetings() {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'meetings'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.seconds || 0;
            const tb = b.createdAt?.seconds || 0;
            return tb - ta;
          });
        setMeetings(fetched);
        setFiltered(fetched);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchMeetings();
  }, [currentUser]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(meetings);
    } else {
      const q = search.toLowerCase();
      setFiltered(meetings.filter(m =>
        (m.title || m.name || '').toLowerCase().includes(q) ||
        (m.host || '').toLowerCase().includes(q)
      ));
    }
  }, [search, meetings]);

  // ── EMPTY STATE ────────────────────────────────────────────────────
  if (!loading && meetings.length === 0) {
    return (
      <div style={{
        fontFamily: font, height: '100%', width: '100%',
        background: '#F8FAFC', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: '#FFFFFF', borderRadius: 24, border: '1px solid #E2E8F0',
          padding: '72px 56px', maxWidth: 520, width: '100%',
          textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, background: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <VideoOff size={40} color="#3B82F6" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.02em' }}>
            No meetings yet
          </h2>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 36, fontWeight: 500 }}>
            Start by uploading a recording or start a live meeting. Your meetings will appear here once added.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/upload')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', borderRadius: 12,
                background: '#2563EB', color: '#FFF', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
            >
              <UploadCloud size={16} /> Upload Recording
            </button>
            <button
              onClick={() => navigate('/live')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 22px', borderRadius: 12,
                background: '#FFF', color: '#0F172A',
                border: '1px solid #E2E8F0',
                fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFF'}
            >
              <Plus size={16} /> Start New Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MEETINGS LIST ──────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: font, height: '100%', width: '100%', background: '#F8FAFC', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Your Meetings
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: '#2563EB', color: '#FFF', border: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            <UploadCloud size={16} /> Upload Recording
          </button>
        </div>

        {/* Search + View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
            <input
              type="text"
              placeholder="Search meetings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 40px',
                borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14,
                outline: 'none', background: '#FFFFFF', fontFamily: font
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#2563EB'}
              onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
            />
          </div>
          <div style={{ display: 'flex', background: '#E2E8F0', borderRadius: 10, padding: 4 }}>
            <div onClick={() => setViewMode('list')} style={{ padding: '6px 12px', borderRadius: 7, background: viewMode === 'list' ? '#FFF' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <List size={16} color={viewMode === 'list' ? '#2563EB' : '#64748B'} />
            </div>
            <div onClick={() => setViewMode('grid')} style={{ padding: '6px 12px', borderRadius: 7, background: viewMode === 'grid' ? '#FFF' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <LayoutGrid size={16} color={viewMode === 'grid' ? '#2563EB' : '#64748B'} />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 size={32} color="#3B82F6" className="animate-spin" />
          </div>
        )}

        {/* No search results */}
        {!loading && filtered.length === 0 && meetings.length > 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: '#FFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <Search size={32} color="#94A3B8" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>No results found</h3>
            <p style={{ fontSize: 14, color: '#64748B' }}>Try a different search term.</p>
          </div>
        )}

        {/* Meetings Grid or List */}
        {!loading && filtered.length > 0 && (
          viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filtered.map(m => <MeetingCard key={m.id} m={m} currentUser={currentUser} navigate={navigate} grid />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map(m => <MeetingCard key={m.id} m={m} currentUser={currentUser} navigate={navigate} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MeetingCard({ m, currentUser, navigate, grid }) {
  const title = m.title || m.name || 'Untitled Meeting';
  const dateStr = m.date || (m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A');
  const timeStr = m.time || (m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '');
  const hostInitial = (m.host || currentUser?.displayName || 'U')[0].toUpperCase();
  const isProcessed = m.transcript || m.summary;

  return (
    <div
      style={{
        background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0',
        padding: grid ? '24px' : '20px 28px',
        display: grid ? 'flex' : 'flex',
        flexDirection: grid ? 'column' : 'row',
        justifyContent: grid ? 'flex-start' : 'space-between',
        alignItems: grid ? 'flex-start' : 'center',
        gap: grid ? 20 : 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
      onClick={() => navigate(`/meeting/${m.id}`)}
    >
      {/* Left / Top info */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CalendarIcon size={13} /> {dateStr}</span>
          {timeStr && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {timeStr}</span>}
          {m.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>• {m.duration}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StackedAvatars count={m.attendees || 1} hostInitial={hostInitial} />
          {m.host && <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Host: {m.host}</span>}
        </div>
      </div>

      {/* Right / Bottom actions */}
      <div style={{ display: 'flex', flexDirection: grid ? 'row' : 'column', alignItems: grid ? 'center' : 'flex-end', gap: 12, flexShrink: 0, marginTop: grid ? 0 : 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px',
          borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: isProcessed ? '#ECFDF5' : '#FFF7ED',
          color: isProcessed ? '#10B981' : '#F59E0B',
          border: `1px solid ${isProcessed ? '#A7F3D0' : '#FED7AA'}`
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: isProcessed ? '#10B981' : '#F59E0B' }} />
          {isProcessed ? 'Processed' : 'Processing...'}
        </div>
        <Link
          to={`/meeting/${m.id}`}
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 9, background: '#EFF6FF', color: '#2563EB',
            border: '1px solid #BFDBFE', fontSize: 13, fontWeight: 700,
            textDecoration: 'none'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
          onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
        >
          <Video size={13} /> View
        </Link>
      </div>
    </div>
  );
}
