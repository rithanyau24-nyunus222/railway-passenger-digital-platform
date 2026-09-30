import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Search, 
  Ticket, 
  Radio, 
  Bell, 
  ShieldAlert, 
  TrainTrack, 
  Users, 
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, login } = useAuth();

  const handleSwitchRole = async (targetRole) => {
    if (targetRole === 'ADMIN') {
      await login('admin@example.com', 'AdminPassword123');
    } else {
      await login('passenger@example.com', 'DemoPassword123');
    }
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    color: isActive ? '#1d4ed8' : '#475569',
    background: isActive ? '#eff6ff' : 'transparent',
    border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
    fontWeight: isActive ? 700 : 500,
    textDecoration: 'none',
    transition: 'all var(--transition-fast)',
    fontSize: '0.925rem'
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 90
          }}
          className="sidebar-backdrop"
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: '#ffffff',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          position: 'sticky',
          top: 'var(--header-height)',
          height: 'calc(100vh - var(--header-height))',
          zIndex: 95,
          transition: 'transform var(--transition-normal)',
          overflowY: 'auto'
        }}
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Passenger Section */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                fontWeight: 700,
                padding: '0 0.75rem 0.5rem'
              }}
            >
              Passenger Services
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <NavLink to="/dashboard" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/search" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                <Search size={18} />
                <span>Search Trains</span>
              </NavLink>

              <NavLink to="/bookings" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                <Ticket size={18} />
                <span>My Bookings</span>
              </NavLink>

              <NavLink to="/train-status" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                <Radio size={18} />
                <span>Live Train Status</span>
              </NavLink>

              <NavLink to="/notifications" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                <Bell size={18} />
                <span>Notifications</span>
              </NavLink>
            </nav>
          </div>

          {/* Admin Management Section */}
          {isAdmin && (
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  color: 'var(--warning)',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  padding: '0 0.75rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ShieldAlert size={14} />
                <span>Administration</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <NavLink to="/admin" end style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                  <LayoutDashboard size={18} />
                  <span>Admin Dashboard</span>
                </NavLink>

                <NavLink to="/admin/trains" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                  <TrainTrack size={18} />
                  <span>Fleet Management</span>
                </NavLink>

                <NavLink to="/admin/bookings" style={navItemStyle} onClick={() => window.innerWidth < 768 && onClose && onClose()}>
                  <Users size={18} />
                  <span>Master Bookings</span>
                </NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Quick Presentation Switcher for Evaluators */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginTop: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Demo Switcher</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Toggle active role for demonstration:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleSwitchRole('PASSENGER')}
              className={`btn btn-sm ${!isAdmin ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
            >
              Passenger
            </button>
            <button
              onClick={() => handleSwitchRole('ADMIN')}
              className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
            >
              Admin
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
