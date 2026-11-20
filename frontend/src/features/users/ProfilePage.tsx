import { ArrowLeft, Check, CircleAlert, LockKeyhole, Mail, Save, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, userApi } from '../../lib/api/client'
import { useAuth } from '../auth/useAuth'
import { SecureImage } from './SecureImage'
import type { User } from '../../types/user'

function initials(name: string) {
  return name.split(/\s+/u).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'MP'
}

export function ProfilePage() {
  const { token, updateUser } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    userApi.current(token, controller.signal)
      .then((currentUser) => {
        setProfile(currentUser)
        setName(currentUser.name)
        setEmail(currentUser.email)
        setError('')
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof ApiError ? loadError.message : 'Le profil n’a pas pu être chargé.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const updatedProfile = await userApi.updateCurrent(token, { name: name.trim(), email: email.trim() })
      setProfile(updatedProfile)
      updateUser(updatedProfile)
      setSuccess(true)
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'La modification du profil a échoué.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loading"><span className="spinner" /> Chargement de votre profil…</div>
  if (!profile) return <div className="content-card state-card"><CircleAlert size={22} /><h2>Profil indisponible</h2><p>{error || 'Impossible de récupérer le profil.'}</p><Link to="/users" className="button button-quiet"><ArrowLeft size={16} /> Retour à la liste</Link></div>

  return (
    <div className="profile-page">
      <div className="page-heading-row">
        <div><div className="eyebrow">ESPACE PERSONNEL</div><h1>Mon profil<span className="heading-period">.</span></h1><p className="page-lead">Gérez les informations de votre compte connecté.</p></div>
        <span className="profile-security-tag"><LockKeyhole size={15} /> Compte sécurisé</span>
      </div>

      <section className="profile-hero-card">
        <div className="profile-cover-pattern" />
        <div className="profile-hero-content">
          {profile.photos[0] ? <SecureImage className="avatar profile-hero-avatar" path={profile.photos[0]} alt={`Photo de ${profile.name}`} placeholder={<span className="avatar profile-hero-avatar profile-initials">{initials(profile.name)}</span>} /> : <span className="avatar profile-hero-avatar profile-initials">{initials(profile.name)}</span>}
          <div className="profile-hero-copy"><span className="member-status"><span /> Compte actif</span><h2>{profile.name}</h2><p>{profile.email}</p></div>
          <span className="profile-member-id">ID <strong>USR-{String(profile.id).padStart(4, '0')}</strong></span>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="content-card edit-card">
          <div className="card-heading"><span className="soft-icon"><UserRound size={17} /></span><div><h2>Informations personnelles</h2><p>Modifiez votre nom ou votre adresse email.</p></div></div>
          <form className="form-stack profile-form" onSubmit={handleSubmit}>
            <div><label className="field-label" htmlFor="profile-name">Nom complet</label><div className="input-wrap"><UserRound size={16} /><input id="profile-name" autoComplete="name" required maxLength={201} value={name} onChange={(event) => setName(event.target.value)} /></div></div>
            <div><label className="field-label" htmlFor="profile-email">Adresse email</label><div className="input-wrap"><Mail size={16} /><input id="profile-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></div></div>
            {error && <p className="form-alert" role="alert">{error}</p>}
            {success && <p className="form-success" role="status"><Check size={16} /> Votre profil a bien été mis à jour.</p>}
            <div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></div>
          </form>
        </section>

        <aside className="content-card account-card">
          <div className="card-heading"><span className="soft-icon coral"><LockKeyhole size={17} /></span><div><h2>Votre compte</h2><p>Paramètres de connexion</p></div></div>
          <div className="account-detail-row"><span className="account-detail-icon"><Mail size={16} /></span><span><small>ADRESSE EMAIL</small><strong>{profile.email}</strong></span></div>
          <div className="account-detail-row"><span className="account-detail-icon"><LockKeyhole size={16} /></span><span><small>AUTHENTIFICATION</small><strong>Jeton JWT actif</strong></span></div>
          <div className="account-photo-strip"><strong>Mes photos</strong><span>{profile.photos.length}</span><div>{profile.photos.slice(0, 4).map((photo) => <SecureImage className="photo-stack-image" key={photo} path={photo} alt="Photo de profil" placeholder={<span className="photo-stack-placeholder"><UserRound size={13} /></span>} />)}{profile.photos.length === 0 && <span className="empty-photo-thumb"><UserRound size={14} /></span>}</div></div>
          <p className="account-note">Pour modifier votre mot de passe, contactez l’administrateur de votre espace.</p>
        </aside>
      </div>
    </div>
  )
}
