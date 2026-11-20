import { ArrowLeft, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthFrame({
  title,
  description,
  children,
  footer,
  eyebrow = 'VOTRE ESPACE',
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  eyebrow?: string
}) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Makeprops">
        <Link className="brand brand-light" to="/login">
          <span className="brand-mark"><Sparkles size={20} /></span>
          <span>makeprops</span>
        </Link>
        <div className="auth-visual-copy">
          <span className="eyebrow eyebrow-light">ESPACE ADMINISTRATION</span>
          <h1>Un espace clair pour mieux gérer vos utilisateurs.</h1>
          <p>Retrouvez vos comptes, leurs coordonnées et leurs photos au même endroit.</p>
        </div>
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="visual-stat-card">
          <span className="stat-icon"><Sparkles size={16} /></span>
          <div><strong>Simple, serein, sécurisé.</strong><small>Votre espace de gestion</small></div>
          <span className="online-dot" />
        </div>
        <span className="visual-footnote">MAKEPROPS · USER MANAGEMENT</span>
      </section>

      <section className="auth-panel">
        <Link to="/login" className="back-link"><ArrowLeft size={16} /> Accueil connexion</Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
        <span className="auth-copyright">© 2026 Makeprops · Tous droits réservés</span>
      </section>
    </main>
  )
}
