import { ArrowRight, Check, ImagePlus, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiRequest } from '../../lib/api/client'
import { AuthFrame } from './AuthFrame'
import { useAuth } from './useAuth'

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maximumFileSize = 5 * 1024 * 1024

export function RegisterPage({ createOnly = false }: { createOnly?: boolean }) {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const previewUrls = useRef<string[]>([])
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrls.current = files.slice(0, 5).map((photo) => URL.createObjectURL(photo))
    setPreviews(previewUrls.current)
    setPhotos(files)
    event.target.value = ''
    if (files.length < 1 || files.length > 5) {
      setPhotoError('Sélectionnez entre 1 et 5 photos.')
    } else if (files.some((file) => !allowedImageTypes.has(file.type))) {
      setPhotoError('Choisissez des images JPEG, PNG ou WebP.')
    } else if (files.some((file) => file.size > maximumFileSize)) {
      setPhotoError('Chaque image doit peser 5 Mo maximum.')
    } else {
      setPhotoError('')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (photoError || photos.length === 0) {
      setPhotoError('Ajoutez au moins une photo valide pour continuer.')
      return
    }

    const formData = new FormData()
    formData.set('firstName', firstName.trim())
    formData.set('lastName', lastName.trim())
    formData.set('email', email.trim())
    formData.set('password', password)
    photos.forEach((photo) => formData.append('photos', photo))

    setSubmitting(true)
    try {
      if (createOnly) {
        await apiRequest<unknown>('/user/register', { method: 'POST', body: formData })
      } else {
        await register(formData)
      }
      setSuccess('Votre compte est créé. Redirection vers votre espace…')
      window.setTimeout(() => navigate('/users', {
        replace: true,
        state: createOnly ? { notice: `Le compte ${firstName.trim()} ${lastName.trim()} a été créé.` } : undefined,
      }), 700)
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : 'La création du compte a échoué.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame
      eyebrow={createOnly ? 'NOUVEAU COMPTE' : 'INSCRIPTION'}
      title="Créer un compte"
      description="Configurez votre espace et ajoutez vos premières photos."
      footer={createOnly
        ? <>Vous souhaitez revenir ? <Link to="/users">Retour à la liste <ArrowRight size={14} /></Link></>
        : <>Déjà inscrit ? <Link to="/login">Se connecter <ArrowRight size={14} /></Link></>}
    >
      <form className="form-stack register-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div>
            <label className="field-label" htmlFor="first-name">Prénom</label>
            <div className="input-wrap"><UserRound size={16} aria-hidden="true" />
              <input id="first-name" autoComplete="given-name" placeholder="Camille" required maxLength={100}
                value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="last-name">Nom</label>
            <div className="input-wrap"><UserRound size={16} aria-hidden="true" />
              <input id="last-name" autoComplete="family-name" placeholder="Durand" required maxLength={100}
                value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
          </div>
        </div>

        <label className="field-label" htmlFor="register-email">Adresse email</label>
        <div className="input-wrap"><Mail size={16} aria-hidden="true" />
          <input id="register-email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required maxLength={254}
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>

        <label className="field-label" htmlFor="register-password">Mot de passe</label>
        <div className="input-wrap"><LockKeyhole size={16} aria-hidden="true" />
          <input id="register-password" type="password" autoComplete="new-password" placeholder="15 caractères minimum"
            minLength={15} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <p className="field-note">Utilisez une phrase de passe d’au moins 15 caractères.</p>

        <div>
          <label className="field-label" htmlFor="register-photos">Photos</label>
          <label className={`upload-zone${photoError ? ' upload-zone-error' : ''}`} htmlFor="register-photos">
            <span className="upload-icon"><ImagePlus size={20} /></span>
            <span><strong>{photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''} sélectionnée${photos.length > 1 ? 's' : ''}` : 'Choisir des photos'}</strong>
              <small>JPEG, PNG ou WebP · 5 Mo max. chacune · 5 fichiers</small></span>
            <span className="upload-browse">Parcourir</span>
          </label>
          <input id="register-photos" className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-required="true"
            onChange={handlePhotoChange} />
          {previews.length > 0 && <div className="photo-preview-row">{previews.map((src, index) =>
            <img className="photo-preview" src={src} alt={`Aperçu ${index + 1}`} key={src} />,
          )}</div>}
          {photoError && <p className="field-error" role="alert">{photoError}</p>}
        </div>

        {error && <p className="form-alert" role="alert">{error}</p>}
        {success && <p className="form-success" role="status"><Check size={16} /> {success}</p>}
        <button className="button button-primary button-full" type="submit" disabled={submitting || Boolean(photoError) || Boolean(success)}>
          {submitting ? 'Création…' : 'Créer mon compte'} <ArrowRight size={17} />
        </button>
        <p className="form-hint"><LockKeyhole size={13} /> Vos photos sont stockées en sécurité.</p>
      </form>
    </AuthFrame>
  )
}
