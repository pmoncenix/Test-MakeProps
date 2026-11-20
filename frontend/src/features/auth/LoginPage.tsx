import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api/client'
import { AuthFrame } from './AuthFrame'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/users'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : 'La connexion a échoué.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="BON RETOUR"
      title="Connectez-vous"
      description="Accédez à votre espace de gestion des utilisateurs."
      footer={<>Pas encore de compte ? <Link to="/register">Créer un compte <ArrowRight size={14} /></Link></>}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="login-email">Adresse email</label>
        <div className="input-wrap">
          <Mail size={17} aria-hidden="true" />
          <input id="login-email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>

        <div className="field-label-row">
          <label className="field-label" htmlFor="login-password">Mot de passe</label>
        </div>
        <div className="input-wrap">
          <LockKeyhole size={17} aria-hidden="true" />
          <input id="login-password" type="password" autoComplete="current-password" placeholder="Votre mot de passe"
            required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>

        {error && <p className="form-alert" role="alert">{error}</p>}
        <button className="button button-primary button-full" type="submit" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'} <ArrowRight size={17} />
        </button>
        <p className="form-hint"><LockKeyhole size={13} /> Vos données de connexion sont protégées.</p>
      </form>
    </AuthFrame>
  )
}
