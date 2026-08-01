'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  Plus,
  Share2,
  Copy,
  FolderPlus,
  Check,
  ArrowLeft,
  Layers,
  CheckSquare,
  Square,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react'
import { AnimatedTabs } from '@/components/animations/AnimatedTabs'
import { TabPanel } from '@/components/animations/TabPanel'
import { Modal } from '@/components/Modal'
import { DropZone } from '@/components/DropZone'

type Photo = {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  thumbnail_url: string | null
  category: string
  status: string
  created_at: string
  photographer_id?: string
}

type Album = {
  id: string
  name: string
  description: string | null
  share_token: string
  is_public: boolean
  cover_photo_id: string | null
  created_at: string
  album_photos?: { count: number }[]
}

type Tab = 'all' | 'albums' | 'unfiled'

export default function PortfolioPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('all')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [photoAlbumMap, setPhotoAlbumMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const [showUpload, setShowUpload] = useState(false)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [showMoveToAlbum, setShowMoveToAlbum] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [shareModal, setShareModal] = useState<Album | null>(null)
  const [error, setError] = useState('')

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const loadAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [photosRes, albumsRes, mappingsRes] = await Promise.all([
      supabase
        .from('photos')
        .select('id, title, description, price, image_url, thumbnail_url, category, status, created_at, photographer_id')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('albums')
        .select('id, name, description, share_token, is_public, cover_photo_id, created_at, album_photos(count)')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('album_photos')
        .select('album_id, photo_id, albums!inner(photographer_id)')
        .eq('albums.photographer_id', user.id),
    ])

    const map: Record<string, string[]> = {}
    for (const m of mappingsRes.data || []) {
      if (!map[m.photo_id]) map[m.photo_id] = []
      map[m.photo_id].push(m.album_id)
    }

    setPhotos(photosRes.data || [])
    setAlbums(albumsRes.data || [])
    setPhotoAlbumMap(map)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setSelectAll(false)
  }, [tab, selectedAlbum])

  function getVisiblePhotos(): Photo[] {
    if (selectedAlbum) {
      const ids = new Set(
        Object.entries(photoAlbumMap)
          .filter(([, ids]) => ids.includes(selectedAlbum.id))
          .map(([id]) => id)
      )
      return photos.filter((p) => ids.has(p.id))
    }
    if (tab === 'unfiled') {
      return photos.filter((p) => !photoAlbumMap[p.id] || photoAlbumMap[p.id].length === 0)
    }
    if (tab === 'albums') return []
    return photos
  }

  function toggleSelect(id: string) {
    const s = new Set(selectedIds)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelectedIds(s)
  }

  function getVisiblePhotosSafe(): Photo[] {
    try {
      return getVisiblePhotos()
    } catch {
      return []
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm('Excluir esta foto permanentemente?')) return
    const res = await fetch(`/api/photos?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError('Erro ao excluir: ' + (d.error || res.statusText))
      return
    }
    setPhotos(photos.filter((p) => p.id !== id))
    setSelectedIds((s) => {
      s.delete(id)
      return new Set(s)
    })
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Excluir ${selectedIds.size} foto(s)?`)) return
    let failed = 0
    for (const id of selectedIds) {
      const res = await fetch(`/api/photos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) failed += 1
    }
    if (failed > 0) {
      setError(`${failed} foto(s) não puderam ser excluídas`)
    }
    setPhotos(photos.filter((p) => !selectedIds.has(p.id) || failed > 0 ? p.id !== '' : true))
    setSelectedIds(new Set())
    setSelectionMode(false)
    setSelectAll(false)
    loadAll()
  }

  async function toggleShare() {
    if (!shareModal) return
    const newState = !shareModal.is_public
    const { error: err } = await supabase
      .from('albums')
      .update({ is_public: newState })
      .eq('id', shareModal.id)
    if (err) {
      setError('Erro: ' + err.message)
      return
    }
    setShareModal({ ...shareModal, is_public: newState })
    setAlbums(albums.map((a) => (a.id === shareModal.id ? { ...a, is_public: newState } : a)))
    if (selectedAlbum?.id === shareModal.id) {
      setSelectedAlbum({ ...selectedAlbum, is_public: newState })
    }
  }

  async function deleteAlbum() {
    if (!shareModal) return
    if (!confirm(`Apagar o álbum "${shareModal.name}"? As fotos não serão excluídas.`)) return
    const { error: err } = await supabase.from('albums').delete().eq('id', shareModal.id)
    if (err) {
      setError('Erro: ' + err.message)
      return
    }
    setShareModal(null)
    if (selectedAlbum?.id === shareModal.id) setSelectedAlbum(null)
    loadAll()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  const visiblePhotos = getVisiblePhotos()

  const unfiledCount = photos.filter((p) => !photoAlbumMap[p.id]?.length).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedAlbum && (
            <button
              onClick={() => setSelectedAlbum(null)}
              className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 dark:text-paper-200 dark:hover:bg-ink-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
              {selectedAlbum ? selectedAlbum.name : 'Meu Portfólio'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {selectedAlbum
                ? `${visiblePhotos.length} foto(s) neste álbum`
                : `${albums.length} álbuns · ${photos.length} fotos`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!selectedAlbum && (
            <button
              onClick={() => setShowCreateAlbum(true)}
              className="flex items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
            >
              <FolderPlus className="h-4 w-4" />
              Criar álbum
            </button>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Upload className="h-4 w-4" />
            Enviar foto
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!selectedAlbum && (
        <AnimatedTabs
          tabs={[
            { id: 'all', label: 'Tudo', count: photos.length },
            { id: 'albums', label: 'Álbuns', count: albums.length },
            { id: 'unfiled', label: 'Avulsas', count: unfiledCount },
          ].map((t) => ({
            ...t,
            onClick: () => setTab(t.id as Tab),
          }))}
          active={tab}
          variant="underline"
        />
      )}

      {(tab === 'all' || tab === 'unfiled' || selectedAlbum) && visiblePhotos.length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-ink-900/5 bg-paper-50 p-3 dark:border-paper-100/5 dark:bg-ink-900">
          <button
            onClick={() => {
              setSelectionMode(!selectionMode)
              if (selectionMode) {
                setSelectedIds(new Set())
                setSelectAll(false)
              }
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
              selectionMode
                ? 'bg-sunset-500 text-white'
                : 'text-ink-600 hover:bg-ink-100 dark:text-paper-200 dark:hover:bg-ink-800'
            }`}
          >
            {selectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {selectionMode ? 'Sair da seleção' : 'Selecionar'}
          </button>

          {selectionMode && (
            <>
              <button
                onClick={() => {
                  setSelectAll(!selectAll)
                  if (!selectAll) setSelectedIds(new Set(visiblePhotos.map((p) => p.id)))
                  else setSelectedIds(new Set())
                }}
                className="text-sm text-ink-600 hover:text-ink-900 dark:text-paper-200"
              >
                {selectAll ? 'Desmarcar tudo' : 'Selecionar tudo'}
              </button>
              <span className="text-sm text-ink-500">{selectedIds.size} selecionada(s)</span>

              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setShowMoveToAlbum(true)}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-900/10 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Mover para álbum
                </button>
                <button
                  onClick={bulkDelete}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <TabPanel active={tab} tabId="albums">
        {!selectedAlbum && (
          <>
            {albums.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Nenhum álbum ainda"
                description="Crie um álbum para organizar suas fotos por evento, viagem ou tema"
                action={
                  <button
                    onClick={() => setShowCreateAlbum(true)}
                    className="btn-primary mt-4 flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Plus className="h-4 w-4" /> Criar primeiro álbum
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map((album) => {
                  const photoCount = album.album_photos?.[0]?.count || 0
                  const coverPhoto = photos.find((p) => p.id === album.cover_photo_id)
                  return (
                    <button
                      key={album.id}
                      onClick={() => setSelectedAlbum(album)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-900/5 bg-paper-50 text-left hover-lift dark:border-paper-100/5 dark:bg-ink-900"
                    >
                      {coverPhoto ? (
                        <img
                          src={coverPhoto.thumbnail_url || coverPhoto.image_url}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : photoCount > 0 ? (
                        <img
                          src={photos.find((p) => photoAlbumMap[p.id]?.includes(album.id))?.image_url || ''}
                          alt=""
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-ink-100 dark:bg-ink-800">
                          <ImageIcon className="h-8 w-8 text-ink-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-x-3 bottom-3 text-left text-white">
                        <p className="font-mono text-base font-semibold truncate">{album.name}</p>
                        <p className="text-xs text-white/70">
                          {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                          {album.is_public && ' · Público'}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel active={tab} tabId={selectedAlbum ? 'unfiled' : tab}>
        <>
          {visiblePhotos.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title={selectedAlbum ? 'Álbum vazio' : 'Sem fotos ainda'}
              description={
                selectedAlbum
                  ? 'Adicione fotos a este álbum usando a seleção em lote'
                  : 'Clique em "Enviar foto" para adicionar'
              }
              action={
                !selectedAlbum ? (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="btn-primary mt-4 flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Upload className="h-4 w-4" /> Enviar foto
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visiblePhotos.map((photo) => {
                const isSelected = selectedIds.has(photo.id)
                return (
                  <div
                    key={photo.id}
                    className={`group relative rounded-xl overflow-hidden border-2 bg-paper-50 transition dark:bg-ink-900 ${
                      isSelected ? 'border-sunset-500' : 'border-transparent'
                    }`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={photo.thumbnail_url || photo.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {selectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelect(photo.id)
                          }}
                          className="absolute top-2 left-2 rounded-md bg-white/90 p-1.5 shadow"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-sunset-500" />
                          ) : (
                            <Square className="h-4 w-4 text-ink-400" />
                          )}
                        </button>
                      )}
                      {!selectionMode && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePhoto(photo.id)
                        }}
                        className={`absolute top-2 right-2 rounded-lg bg-red-500 p-1.5 text-white transition ${
                          selectionMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {selectedAlbum && (
                        <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-mono font-semibold text-ink-900">
                          R$ {photo.price.toFixed(2).replace('.', ',')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      </TabPanel>

      {selectedAlbum && (
        <div className="sticky bottom-4 mt-6 flex justify-center gap-2">
          <button
            onClick={() => setShareModal(selectedAlbum)}
            className="flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white shadow-2xl hover:bg-ink-800 dark:bg-paper-50 dark:text-ink-900"
          >
            <Share2 className="h-4 w-4" />
            {selectedAlbum.is_public ? 'Compartilhar' : 'Ativar compartilhamento'}
          </button>
        </div>
      )}

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => {
          setShowUpload(false)
          loadAll()
        }}
        supabase={supabase}
        userId={userId}
        onError={setError}
      />

      <CreateAlbumModal
        open={showCreateAlbum}
        onClose={() => setShowCreateAlbum(false)}
        onCreated={(album: Album) => {
          setShowCreateAlbum(false)
          setAlbums([album, ...albums])
          setSelectedAlbum(album)
        }}
        onError={setError}
      />

      <MoveToAlbumModal
        open={showMoveToAlbum}
        onClose={() => setShowMoveToAlbum(false)}
        onMoved={() => {
          setShowMoveToAlbum(false)
          setSelectedIds(new Set())
          setSelectionMode(false)
          loadAll()
        }}
        photoIds={Array.from(selectedIds)}
        albums={albums}
        onError={setError}
      />

      {shareModal && (
        <ShareModal
          album={shareModal}
          onClose={() => setShareModal(null)}
          onToggle={toggleShare}
          onDelete={deleteAlbum}
        />
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="h-12 w-12 text-ink-300" />
      <p className="mt-4 text-sm font-medium text-ink-700 dark:text-paper-200">{title}</p>
      <p className="text-xs text-ink-500">{description}</p>
      {action}
    </div>
  )
}

function UploadModal({ open, onClose, onUploaded, supabase, userId, onError }: any) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Paisagem')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setDescription('')
      setPrice('')
      setFile(null)
      setProgress(0)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title || !price) {
      onError('Preencha título, preço e selecione uma foto')
      return
    }
    setUploading(true)
    setProgress(10)
    onError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('price', price)
      fd.append('category', category)

      setProgress(40)

      const res = await fetch('/api/photos', { method: 'POST', body: fd })
      setProgress(80)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      setProgress(100)
      onUploaded()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Enviar foto" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
              Título <span className="text-ink-400 text-xs">(privado)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
              placeholder="Ex: Pôr do sol na Serra"
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
              Preço (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
              placeholder="49,90"
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
            >
              {['Paisagem', 'Retrato', 'Urbano', 'Natureza', 'Esporte', 'Eventos', 'Comida', 'Animal', 'Arquitetura', 'Abstrato'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
              Descrição <span className="text-ink-400 text-xs">(privada)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={uploading}
              className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
              placeholder="Notas internas sobre a foto..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
              Arquivo da foto
            </label>
            <DropZone
              value={file}
              onFile={(f) => setFile(f)}
              accept="image/*"
              maxSizeMB={50}
            />
          </div>
        </div>

        {uploading && (
          <div className="overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <div
              className="h-1.5 bg-gradient-to-r from-sunset-500 to-orange-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex gap-3 border-t border-ink-900/5 pt-4 dark:border-paper-100/5">
          <button
            type="submit"
            disabled={uploading || !file || !title || !price}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Upload className="h-4 w-4" /> Publicar foto</>}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-xl border border-ink-900/10 px-5 py-2.5 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CreateAlbumModal({ open, onClose, onCreated, onError }: any) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverColor, setCoverColor] = useState('sunset')
  const [creating, setCreating] = useState(false)

  const coverColors = [
    { id: 'sunset', label: 'Sunset', class: 'from-sunset-500 to-orange-500' },
    { id: 'purple', label: 'Purple', class: 'from-purple-500 to-pink-500' },
    { id: 'blue', label: 'Blue', class: 'from-blue-500 to-cyan-500' },
    { id: 'green', label: 'Green', class: 'from-green-500 to-emerald-500' },
    { id: 'gray', label: 'Cinza', class: 'from-ink-400 to-ink-600' },
  ]

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setCoverColor('sunset')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      onError('Nome é obrigatório')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      onCreated({ ...data, album_photos: [{ count: 0 }] })
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Criar álbum" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cover preview */}
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-2">
            Capa do álbum
          </label>
          <div className="grid grid-cols-5 gap-2">
            {coverColors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCoverColor(c.id)}
                className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br transition ${
                  c.class
                } ${
                  coverColor === c.id
                    ? 'ring-2 ring-sunset-500 ring-offset-2 ring-offset-paper-50 dark:ring-offset-ink-900 scale-95'
                    : 'hover:scale-105'
                }`}
                aria-label={c.label}
              >
                {coverColor === c.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white drop-shadow-lg" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
            Nome do álbum
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
            placeholder="Ex: Ensaio Casamento Praia"
            autoFocus
            disabled={creating}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
            Descrição <span className="text-ink-400 text-xs">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={creating}
            className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
            placeholder="Detalhes do álbum..."
          />
        </div>
        <div className="flex gap-3 border-t border-ink-900/5 pt-4 dark:border-paper-100/5">
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</> : <><FolderPlus className="h-4 w-4" /> Criar álbum</>}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-xl border border-ink-900/10 px-5 py-2.5 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function MoveToAlbumModal({ open, onClose, onMoved, photoIds, albums, onError }: any) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showNewAlbum, setShowNewAlbum] = useState(false)

  async function moveToAlbum(albumId: string) {
    try {
      const res = await fetch(`/api/albums/${albumId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_ids: photoIds }),
      })
      if (!res.ok) throw new Error('Erro ao mover')
      onMoved()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro')
    }
  }

  async function createNewAlbum(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await moveToAlbum(data.id)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro')
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Mover ${photoIds.length} foto(s)`}>
      {showNewAlbum ? (
        <form onSubmit={createNewAlbum} className="space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do novo álbum"
            autoFocus
            className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Criar e mover
            </button>
            <button type="button" onClick={() => setShowNewAlbum(false)} className="rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 dark:border-paper-100/10 dark:text-paper-200">
              Voltar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {albums.length === 0 ? (
            <p className="text-sm text-ink-500">Você ainda não tem álbuns. Crie um novo:</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {albums.map((a: Album) => (
                <button
                  key={a.id}
                  onClick={() => moveToAlbum(a.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-ink-900/5 p-3 text-left hover:border-sunset-500/30 hover:bg-sunset-500/5 dark:border-paper-100/5"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{a.name}</p>
                    <p className="text-xs text-ink-500">{a.album_photos?.[0]?.count || 0} fotos</p>
                  </div>
                  <ArrowUpDown className="h-4 w-4 text-ink-400" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowNewAlbum(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-300 p-3 text-sm text-ink-600 hover:border-sunset-500 hover:text-sunset-500 dark:border-paper-100/10 dark:text-paper-200"
          >
            <Plus className="h-4 w-4" />
            Novo álbum
          </button>
        </div>
      )}
    </Modal>
  )
}

type ShareModalProps = {
  album: Album
  onClose: () => void
  onToggle: () => void
  onDelete: () => void
}

function ShareModal({ album, onClose, onToggle, onDelete }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/album/${album.share_token}`
    : `/album/${album.share_token}`

  function copy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={true} onClose={onClose} title={album.is_public ? 'Compartilhar álbum' : 'Ativar compartilhamento'}>
      {!album.is_public ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-600 dark:text-paper-200">
            Ative para gerar um link público. As fotos serão visíveis apenas pelo link, sem nomes ou descrições — só imagem, preço e botão de compra.
          </p>
          <button onClick={onToggle} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            <Share2 className="h-4 w-4" /> Ativar compartilhamento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-600 dark:text-paper-200">
            Este link é público e pode ser compartilhado com qualquer pessoa. As fotos aparecem sem nome, apenas com preço.
          </p>
          <div className="rounded-xl border border-ink-900/5 bg-ink-100 p-3 dark:border-paper-100/5 dark:bg-ink-800">
            <p className="break-all text-xs font-mono text-ink-600 dark:text-paper-200">{shareUrl}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copy} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              {copied ? <><Check className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar link</>}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200"
            >
              <ExternalLink className="h-4 w-4" /> Abrir
            </a>
          </div>
          <div className="border-t border-ink-900/5 pt-4 dark:border-paper-100/5">
            <button onClick={onToggle} className="text-sm text-ink-500 hover:text-ink-700 dark:hover:text-paper-200">
              Desativar compartilhamento
            </button>
          </div>
          <div className="border-t border-red-200 pt-4 dark:border-red-500/20">
            <button onClick={onDelete} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" /> Apagar álbum
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
