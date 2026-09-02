import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Calendar, Search, BarChart2, Puzzle, Bell, Video, Upload, Settings, History as HistoryIcon, LogOut } from 'lucide-react';

const font = "'Plus Jakarta Sans', sans-serif";

const navItems = [
  { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Calendar size={16} />, label: 'Meetings', path: '/meetings' },
  { icon: <BarChart2 size={16} />, label: 'Insights', path: '/analytics' },
  { icon: <HistoryIcon size={16} />, label: 'History', path: '/history' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div style={{ fontFamily: font, height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F4F7F9' }}>

      {/* ─── LIGHT NAVBAR ─────────────────────────────────── */}
      <nav style={{
        background: '#FFFFFF',
        color: '#0F172A',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        flexShrink: 0,
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 40 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#0F172A' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>MeetLens AI</span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: 8, flex: 1, marginLeft: 20 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (pathname === '/' && item.path === '/dashboard');
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8,
                    fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    background: isActive ? '#F1F5F9' : 'transparent',
                    color: isActive ? '#0F172A' : '#64748B',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = isActive ? '#F1F5F9' : '#F8FAFC'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = isActive ? '#F1F5F9' : 'transparent'; }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            
            {/* Upload Button */}
            <Link to="/upload" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 8,
              background: '#2563EB', color: '#FFFFFF',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
              transition: 'background 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
               onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}>
              <Upload size={14} /> Upload Recording
            </Link>

            {/* Avatar Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  background: '#F8FAFC', padding: '4px 12px 4px 4px', borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                  {initial}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{displayName}</div>
              </div>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  width: 200, background: '#FFFFFF', borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0',
                  padding: 8, zIndex: 100
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #E2E8F0', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{currentUser?.email}</div>
                  </div>
                  
                  <div 
                    onClick={logout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 8, cursor: 'pointer', color: '#EF4444', fontSize: 13, fontWeight: 600,
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} /> Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── PAGE CONTENT (Full Width/Height) ──────── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
}
