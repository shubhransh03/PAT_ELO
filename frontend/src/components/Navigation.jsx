import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 16, left: 16 });
  const triggerRef = useRef(null);
  
  // 3D tilt handlers for nav items
  const handleItemMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * -10; // -10..10 deg
    const ry = (x - 0.5) * 12;  // -12..12 deg
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    el.style.setProperty('--px', `${x * 100}%`);
    el.style.setProperty('--py', `${y * 100}%`);
  };

  const handleItemMouseLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', `0deg`);
    el.style.setProperty('--ry', `0deg`);
    el.style.setProperty('--px', `50%`);
    el.style.setProperty('--py', `50%`);
  };
  
  // Get user role from user metadata
  const userRole = user?.publicMetadata?.role || 'therapist';

  // Close mobile menu and user menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Compute position of the user menu
  const computeMenuPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
  const top = Math.round(rect.bottom + 8);
  const left = Math.round(Math.max(8, rect.right));
  setMenuPosition({ top, left });
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.navigation') && !event.target.closest('.nav-toggle')) {
        setIsOpen(false);
      }
  // Keep dropdown open if clicking inside the right-side portal or trigger
  if (!event.target.closest('.user-menu-trigger') && !event.target.closest('.user-dropdown-portal')) {
        setShowUserMenu(false);
      }
    };

    const handleEsc = (e) => { if (e.key === 'Escape') { setIsOpen(false); setShowUserMenu(false); } };
    const onResizeOrScroll = () => { if (showUserMenu) computeMenuPosition(); };
    if (isOpen || showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      window.addEventListener('resize', onResizeOrScroll);
      window.addEventListener('scroll', onResizeOrScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
        window.removeEventListener('resize', onResizeOrScroll);
        window.removeEventListener('scroll', onResizeOrScroll, true);
      };
    }
  }, [isOpen, showUserMenu]);

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
  roles: ['patient', 'therapist', 'doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/patient-allocation', 
      label: 'Patient Allocation', 
      icon: '👥',
  roles: ['doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/therapy-plans', 
      label: 'Therapy Plans', 
      icon: '📋',
  roles: ['patient', 'therapist', 'doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/sessions', 
      label: 'Sessions', 
      icon: '🗓️',
  roles: ['patient', 'therapist', 'doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/progress-reports', 
      label: 'Progress Reports', 
      icon: '📈',
  roles: ['patient', 'therapist', 'doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/evaluations', 
      label: 'Evaluations', 
      icon: '✅',
  roles: ['doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/analytics', 
      label: 'Analytics', 
  icon: '🧠',
  roles: ['doctor', 'supervisor', 'admin'] 
    },
    { 
      path: '/user-management', 
      label: 'User Management', 
      icon: '👤',
      roles: ['admin'] 
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: '⚙️',
  roles: ['patient', 'therapist', 'doctor', 'supervisor', 'admin'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    if (!showUserMenu) computeMenuPosition();
    setShowUserMenu(!showUserMenu);
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleProfileClick = () => {
    openUserProfile();
  };

  // (role color/icon helpers removed; not used in rendered output)

  return (
    <>
      {/* Top-right User Trigger (avatar only) */}
      <button
        ref={triggerRef}
        className={`user-menu-trigger ${showUserMenu ? 'open' : ''}`}
        onClick={toggleUserMenu}
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={showUserMenu}
      >
        <span className="trigger-avatar" aria-hidden="true">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="User Avatar" />
          ) : (
            <span className="avatar-initial">
              {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || '?'}
            </span>
          )}
        </span>
      </button>

      {/* Mobile Menu Toggle Button */}
      <button 
        className="nav-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <span>{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile Overlay */}
      {isOpen && <div className="navigation-overlay open" onClick={() => setIsOpen(false)} />}

      {/* Navigation Menu */}
      <nav className={`navigation ${isOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <div className="brand-section">
            <div className="brand-icon">🏥</div>
            <div className="brand-text">
              <h3>Therapy CMS</h3>
              <span className="brand-subtitle">Case Management</span>
            </div>
          </div>
        </div>

        {/* Anchored User Dropdown (right-side portal) */}
        {showUserMenu && ReactDOM.createPortal(
          (
            <div
              className="user-dropdown-portal"
              role="menu"
              aria-label="User menu"
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, transform: 'translateX(-100%)' }}
            >
              <div className="portal-menu">
                <button className="dropdown-item" onClick={handleProfileClick}>
                  <span className="item-icon">👤</span>
                  Profile Settings
                </button>
                <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <span className="item-icon">🔔</span>
                  Notifications
                </button>
                <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <span className="item-icon">❓</span>
                  Help & Support
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item sign-out" onClick={handleSignOut}>
                  <span className="item-icon">🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          ),
          document.body
        )}
        
        <ul className="nav-menu">{filteredMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${location.pathname === item.path ? 'nav-link active' : 'nav-link'} tilt-3d`}
                onMouseMove={handleItemMouseMove}
                onMouseLeave={handleItemMouseLeave}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-footer">
          <div className="footer-content">
            <p>© 2025 Therapy CMS</p>
            <div className="footer-links">
              <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
