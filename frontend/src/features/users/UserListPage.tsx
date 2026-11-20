import {
  ArrowDownWideNarrow,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundPen,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ApiError, userApi } from '../../lib/api/client'
import { useAuth } from '../auth/useAuth'
import { SecureImage } from './SecureImage'
import type { User, UserPage } from '../../types/user'

function initials(name: string) {
  return name.split(/\s+/u).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'MP'
}

function UserAvatar({ user, large = false }: { user: User; large?: boolean }) {
  const photo = user.photos[0]
  const className = `avatar user-avatar${large ? ' avatar-large' : ''}`
  const fallback = <span className={`${className} user-avatar-fallback`}>{initials(user.name)}</span>
  return photo
    ? <SecureImage path={photo} className={className} alt={`Photo de ${user.name}`} placeholder={fallback} />
    : fallback
}

export function UserListPage() {
  const { token } = useAuth()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loadedPage, setLoadedPage] = useState<{ key: string; data: UserPage } | null>(null)
  const [requestFailure, setRequestFailure] = useState<{ key: string; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState((location.state as { notice?: string } | null)?.notice ?? '')
  const searchInput = useRef<HTMLInputElement>(null)
  const requestKey = `${debouncedQuery}\u0000${page}\u0000${refreshKey}`
  const error = requestFailure?.key === requestKey ? requestFailure.message : ''
  const pageData = loadedPage?.key === requestKey ? loadedPage.data : null
  const loading = query.trim() !== debouncedQuery || (!error && !pageData)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 280)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const loadPage = debouncedQuery
      ? userApi.search(token, debouncedQuery, page, 10, controller.signal)
      : userApi.list(token, page, 10, controller.signal)

    loadPage
      .then((result) => {
        const lastPage = Math.max(result.pagination.totalPages, 1)
        if (page > lastPage) {
          setPage(lastPage)
          return
        }
        setLoadedPage({ key: requestKey, data: result })
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setRequestFailure({
          key: requestKey,
          message: loadError instanceof ApiError ? loadError.message : 'La liste des utilisateurs n’a pas pu être chargée.',
        })
      })

    return () => controller.abort()
  }, [token, page, debouncedQuery, refreshKey, requestKey])

  async function confirmDelete() {
    if (!token || !selectedUser) return
    setDeleting(true)
    setDeleteError('')
    try {
      await userApi.remove(token, selectedUser.id)
      setSelectedUser(null)
      setNotice(`${selectedUser.name} a été supprimé.`)
      setRefreshKey((current) => current + 1)
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof ApiError ? deleteFailure.message : 'La suppression a échoué.')
    } finally {
      setDeleting(false)
    }
  }

  const users = pageData?.users ?? []
  const pagination = pageData?.pagination
  const isSearching = Boolean(query.trim())

  return (
    <div className="users-page">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">ANNUAIRE · GESTION</div>
          <h1>Utilisateurs<span className="heading-period">.</span></h1>
          <p className="page-lead">Gérez les comptes et retrouvez rapidement les bonnes informations.</p>
        </div>
        <Link className="button button-primary" to="/users/new"><Plus size={17} /> Ajouter un utilisateur</Link>
      </div>

      {notice && <div className="inline-notice" role="status"><CircleCheck size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Fermer le message"><X size={15} /></button></div>}

      <div className="overview-grid">
        <section className="overview-card overview-main-card">
          <div className="overview-icon"><UsersRound size={18} /></div>
          <div className="overview-label">COMPTES RÉFÉRENCÉS</div>
          <div className="overview-value">{pagination?.total ?? '—'}<span>utilisateurs</span></div>
          <div className="overview-meta"><span className="status-pill"><span className="tiny-dot" /> Annuaire à jour</span><span>{pagination?.totalPages ?? 0} pages au total</span></div>
          <div className="overview-art art-users"><UsersRound size={76} strokeWidth={1} /></div>
        </section>
        <section className="overview-card overview-secondary-card">
          <div className="overview-topline"><span className="soft-icon"><ShieldCheck size={17} /></span><span className="card-label">ACCÈS</span></div>
          <div className="secondary-value">Protégé</div>
          <p>Les données sont accessibles aux membres connectés.</p>
          <div className="secondary-meta"><span className="online-dot" /> Session authentifiée <span className="meta-check">✓</span></div>
        </section>
        <section className="overview-card overview-secondary-card">
          <div className="overview-topline"><span className="soft-icon coral"><ArrowDownWideNarrow size={17} /></span><span className="card-label">AFFICHAGE</span></div>
          <div className="secondary-value">10 <span>par page</span></div>
          <p>Une liste organisée pour naviguer sans effort.</p>
          <div className="secondary-meta"><span className="mini-bars"><i /><i /><i /><i /><i /></span> Pagination active <span className="meta-check">✓</span></div>
        </section>
      </div>

      <section className="directory-card">
        <div className="directory-heading">
          <div><div className="section-kicker"><span className="kicker-line" /> RÉPERTOIRE</div><h2>Tous les utilisateurs <span className="count-bubble">{pagination?.total ?? 0}</span></h2>
            <p>Consultez, modifiez ou supprimez un compte.</p></div>
          <button className="button button-quiet" onClick={() => setRefreshKey((current) => current + 1)}><ArrowDownWideNarrow size={15} /> Actualiser</button>
        </div>

        <div className="directory-toolbar">
          <div className="search-field">
            <Search size={17} aria-hidden="true" />
            <input ref={searchInput} aria-label="Rechercher un utilisateur" placeholder="Rechercher par nom, prénom ou email…" value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
            {query && <button aria-label="Effacer la recherche" onClick={() => setQuery('')}><X size={15} /></button>}
            <kbd>⌘ K</kbd>
          </div>
        </div>

        <div className="table-wrap">
          <table className="user-table">
            <thead><tr><th><span className="table-heading">UTILISATEUR</span></th><th><span className="table-heading">ADRESSE EMAIL</span></th><th><span className="table-heading">ID DU COMPTE</span></th><th><span className="table-heading">STATUT</span></th><th><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, index) => <tr className="skeleton-row" key={`skeleton-${index}`}>
                <td><span className="skeleton skeleton-user" /></td><td><span className="skeleton skeleton-line" /></td><td><span className="skeleton skeleton-line short" /></td><td><span className="skeleton skeleton-pill" /></td><td /></tr>)}
              {!loading && error && <tr><td colSpan={5}><div className="table-state table-error"><CircleAlert size={21} /><strong>Impossible de charger les utilisateurs</strong><span>{error}</span><button className="button button-quiet" onClick={() => setRefreshKey((current) => current + 1)}>Réessayer</button></div></td></tr>}
              {!loading && !error && users.length === 0 && <tr><td colSpan={5}><div className="table-state"><span className="empty-icon"><Search size={23} /></span><strong>{isSearching ? 'Aucun résultat' : 'Aucun utilisateur pour le moment'}</strong><span>{isSearching ? `Aucun compte ne correspond à « ${debouncedQuery} ».` : 'Ajoutez un compte pour le voir apparaître ici.'}</span>{!isSearching && <Link className="button button-primary" to="/users/new"><Plus size={16} /> Ajouter un utilisateur</Link>}</div></td></tr>}
              {!loading && !error && users.map((user) => <tr key={user.id}>
                <td><div className="user-cell"><UserAvatar user={user} /><span className="user-cell-copy"><Link to={`/users/${user.id}`} className="user-name">{user.name}</Link><small>Membre Makeprops</small></span></div></td>
                <td><a className="email-cell" href={`mailto:${user.email}`}><Mail size={14} />{user.email}</a></td>
                <td><span className="id-chip">USR-{String(user.id).padStart(4, '0')}</span></td>
                <td><span className="member-status"><span /> Actif</span></td>
                <td><div className="row-actions"><Link to={`/users/${user.id}`} className="icon-button row-edit" title={`Modifier ${user.name}`} aria-label={`Modifier ${user.name}`}><UserRoundPen size={16} /></Link><button className="icon-button row-delete" title={`Supprimer ${user.name}`} aria-label={`Supprimer ${user.name}`} onClick={() => { setSelectedUser(user); setDeleteError('') }}><Trash2 size={16} /></button></div></td>
              </tr>)}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Affichage de <strong>{users.length ? (page - 1) * 10 + 1 : 0}–{Math.min(page * 10, pagination?.total ?? 0)}</strong> sur <strong>{pagination?.total ?? 0}</strong> utilisateurs</span>
          <div className="pagination-controls"><button className="button button-page" aria-label="Page précédente" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /><span>Précédent</span></button><span className="page-number">Page <strong>{page}</strong> / {Math.max(pagination?.totalPages ?? 0, 1)}</span><button className="button button-page" aria-label="Page suivante" disabled={loading || !pagination || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}><span>Suivant</span><ChevronRight size={16} /></button></div>
        </div>
      </section>

      {selectedUser && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setSelectedUser(null) }}>
        <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <button className="icon-button modal-close" onClick={() => setSelectedUser(null)} aria-label="Fermer" disabled={deleting}><X size={18} /></button>
          <span className="modal-warning-icon"><Trash2 size={20} /></span>
          <div className="section-kicker">ACTION DÉFINITIVE</div>
          <h2 id="delete-title">Supprimer cet utilisateur ?</h2>
          <p>Le compte de <strong>{selectedUser.name}</strong> et ses photos seront supprimés. Cette action ne peut pas être annulée.</p>
          {deleteError && <p className="form-alert" role="alert">{deleteError}</p>}
          <div className="modal-actions"><button className="button button-quiet" onClick={() => setSelectedUser(null)} disabled={deleting}>Annuler</button><button className="button button-danger" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? 'Suppression…' : 'Supprimer le compte'} <Trash2 size={15} /></button></div>
        </section>
      </div>}
    </div>
  )
}
