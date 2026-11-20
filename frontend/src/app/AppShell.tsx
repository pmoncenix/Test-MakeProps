import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { checkApiHealth } from '../lib/api/client'
import { useAuth } from '../features/auth/useAuth'

function initials(name: string) {
  return name.split(/\s+/u).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'MP'
}

function HealthBadge() {
  const [online, setOnline] = useState<boolean | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    checkApiHealth(controller.signal).then(() => setOnline(true)).catch(() => setOnline(false))
    return () => controller.abort()
  }, [])

  return <span className={`health-badge ${online ? 'is-online' : online === false ? 'is-offline' : ''}`}>
    <span className="health-dot" /> {online === null ? 'Connexion API' : online ? 'API opérationnelle' : 'API indisponible'}
  </span>
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isProfile = location.pathname === '/profile'
  const isEdit = /^\/users\/\d+$/u.test(location.pathname)
  const title = isProfile ? 'Mon profil' : isEdit ? 'Modifier un utilisateur' : 'Utilisateurs'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-frame">
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Fermer le menu" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar${mobileNavOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <NavLink className="brand" to="/users" onClick={() => setMobileNavOpen(false)}>
            <span className="brand-mark"><Sparkles size={20} /></span><span>makeprops</span>
          </NavLink>
          <button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Fermer le menu"><X size={18} /></button>
        </div>

        <div className="workspace-chip"><span className="workspace-avatar">M</span><span><strong>Makeprops</strong><small>Espace de gestion</small></span><ChevronDown size={15} /></div>

        <span className="sidebar-label">ESPACE DE TRAVAIL</span>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          <NavLink to="/users" end onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <UsersRound size={18} /><span>Utilisateurs</span><span className="nav-shortcut">⌘ 1</span>
          </NavLink>
          <NavLink to="/profile" onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <UserRound size={18} /><span>Mon profil</span>
          </NavLink>
        </nav>

        <span className="sidebar-label sidebar-label-spaced">SÉCURITÉ</span>
        <div className="security-card">
          <span className="security-icon"><ShieldCheck size={17} /></span>
          <div><strong>Session protégée</strong><small>Connexion chiffrée</small></div>
          <span className="online-dot" />
        </div>

        <div className="sidebar-bottom">
          <a className="nav-item docs-link" href="/api-docs" target="_blank" rel="noreferrer">
            <CircleHelp size={17} /><span>Documentation API</span><ArrowUpRight size={14} />
          </a>
          <div className="profile-menu">
            <span className="avatar avatar-small">{initials(user?.name ?? '')}</span>
            <span className="profile-menu-name"><strong>{user?.name ?? 'Utilisateur'}</strong><small>{user?.email ?? ''}</small></span>
            <button className="icon-button logout-button" onClick={handleLogout} title="Se déconnecter" aria-label="Se déconnecter"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Ouvrir le menu"><Menu size={19} /></button>
            <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{title}</strong></div>
          </div>
          <div className="topbar-actions">
            <HealthBadge />
            <a className="topbar-docs" href="/api-docs" target="_blank" rel="noreferrer">API docs <ArrowUpRight size={14} /></a>
            <span className="topbar-divider" />
            <span className="avatar avatar-top">{initials(user?.name ?? '')}</span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer"><span>MAKEPROPS</span><span><Activity size={13} /> Espace sécurisé</span><a href="/health" target="_blank" rel="noreferrer">État du service <ArrowUpRight size={12} /></a></footer>
      </div>
    </div>
  )
}
