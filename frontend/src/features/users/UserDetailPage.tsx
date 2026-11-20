import { ArrowLeft, Check, CircleAlert, ImagePlus, Mail, Save, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, userApi } from '../../lib/api/client'
import { useAuth } from '../auth/useAuth'
import { SecureImage } from './SecureImage'
import type { User } from '../../types/user'

export function UserDetailPage() {
  const { token } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const parsedUserId = userId && /^[1-9]\d*$/u.test(userId) ? Number(userId) : NaN
  const validUserId = Number.isSafeInteger(parsedUserId) ? parsedUserId : null
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || validUserId === null) return
    const controller = new AbortController()
    userApi.get(token, validUserId, controller.signal)
      .then((currentUser) => {
        setUser(currentUser)
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
  }, [token, validUserId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !user) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await userApi.update(token, user.id, { name: name.trim(), email: email.trim() })
      setSuccess(true)
      window.setTimeout(() => navigate('/users', { replace: true, state: { notice: `${name.trim()} a été mis à jour.` } }), 550)
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'La modification a échoué.')
    } finally {
      setSaving(false)
    }
  }

  if (validUserId === null) return <div className="content-card state-card"><CircleAlert size={22} /><h2>Identifiant invalide</h2><p>Choisissez un utilisateur dans l’annuaire.</p><Link to="/users" className="button button-quiet"><ArrowLeft size={16} /> Retour à la liste</Link></div>
  if (loading) return <div className="page-loading"><span className="spinner" /> Chargement du profil…</div>
  if (error && !user) return <div className="content-card state-card"><CircleAlert size={22} /><h2>Profil indisponible</h2><p>{error}</p><Link to="/users" className="button button-quiet"><ArrowLeft size={16} /> Retour à la liste</Link></div>
  if (!user) return null

  return (
    <div className="detail-page">
      <Link to="/users" className="back-link page-back-link"><ArrowLeft size={16} /> Retour aux utilisateurs</Link>
      <div className="page-heading-row detail-heading">
        <div><div className="eyebrow">COMPTE · USR-{String(user.id).padStart(4, '0')}</div><h1>Fiche utilisateur<span className="heading-period">.</span></h1><p className="page-lead">Consultez les informations et modifiez les coordonnées du compte.</p></div>
        <div className="detail-user-chip"><span className="avatar avatar-small">{user.name.split(/\s+/u).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
      </div>

      <div className="detail-grid">
        <section className="content-card edit-card">
          <div className="card-heading"><span className="soft-icon"><UserRound size={17} /></span><div><h2>Informations du compte</h2><p>Les champs marqués sont obligatoires.</p></div></div>
          <form className="form-stack profile-form" onSubmit={handleSubmit}>
            <div><label className="field-label" htmlFor="user-name">Nom complet</label><div className="input-wrap"><UserRound size={16} /><input id="user-name" autoComplete="name" required maxLength={201} value={name} onChange={(event) => setName(event.target.value)} /></div></div>
            <div><label className="field-label" htmlFor="user-email">Adresse email</label><div className="input-wrap"><Mail size={16} /><input id="user-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></div></div>
            {error && <p className="form-alert" role="alert">{error}</p>}
            {success && <p className="form-success" role="status"><Check size={16} /> Modifications enregistrées. Redirection…</p>}
            <div className="form-actions"><Link to="/users" className="button button-quiet">Annuler</Link><button className="button button-primary" type="submit" disabled={saving || success}><Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button></div>
          </form>
        </section>

        <section className="content-card photo-card">
          <div className="card-heading"><span className="soft-icon coral"><ImagePlus size={17} /></span><div><h2>Photos du compte</h2><p>{user.photos.length} photo{user.photos.length > 1 ? 's' : ''} enregistrée{user.photos.length > 1 ? 's' : ''}</p></div></div>
          {user.photos.length > 0 ? <div className="detail-photo-grid">{user.photos.map((photo, index) => <SecureImage className="detail-photo-image" key={photo} path={photo} alt={`Photo ${index + 1} de ${user.name}`} />)}</div> : <div className="empty-photo-state"><ImagePlus size={22} /><span>Aucune photo pour ce compte.</span></div>}
          <div className="photo-note"><span className="online-dot" /> Les photos ont été validées lors de l’inscription.</div>
        </section>
      </div>
    </div>
  )
}
