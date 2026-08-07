import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Search, MessageSquare, Upload, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Calendar, label: 'Meetings', path: '/dashboard' }, // keeping simple for MVP
    { icon: Search, label: 'Search', path: '/search' },
    { icon: MessageSquare, label: 'Ask', path: '/search' },
  ];

  return (
    <aside className="sidebar">
      <div className="flex items-center gap-2 mb-8 text-xl font-bold">
        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <MessageSquare size={24} />
        </div>
        Catch Me Up
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.label === 'Home' && location.pathname.includes('/meeting/'));
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <Link to="/upload" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
          <Upload size={18} /> Upload
        </Link>
        <Link to="/settings" className="nav-item">
          <Settings size={20} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
