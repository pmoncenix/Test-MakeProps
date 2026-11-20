import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { AUTH_INVALID_EVENT, mediaUrl } from '../../lib/api/client'

export function SecureImage({
  path,
  alt,
  className,
  placeholder,
}: {
  path: string
  alt: string
  className: string
  placeholder?: ReactNode
}) {
  const { token } = useAuth()
  const [loadedImage, setLoadedImage] = useState<{ path: string; token: string; url: string } | null>(null)

  useEffect(() => {
    if (!token || !path) return

    const controller = new AbortController()
    let active = true
    let createdUrl: string | null = null
    fetch(mediaUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) window.dispatchEvent(new Event(AUTH_INVALID_EVENT))
          throw new Error('La photo ne peut pas être chargée.')
        }
        return response.blob()
      })
      .then((blob) => {
        createdUrl = URL.createObjectURL(blob)
        if (active) setLoadedImage({ path, token, url: createdUrl })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
      })

    return () => {
      active = false
      controller.abort()
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [path, token])

  const objectUrl = loadedImage?.path === path && loadedImage.token === token ? loadedImage.url : null
  if (!objectUrl) return placeholder ?? <span className={`${className} secure-image-placeholder`} aria-hidden="true" />
  return <img className={className} src={objectUrl} alt={alt} />
}
