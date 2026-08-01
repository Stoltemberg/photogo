'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Upload, Trash2, Loader2, X, AlertCircle } from 'lucide-react'

type Photo = {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  category: string
  created_at: string
}

export default function PortfolioPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  // Upload form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Paisagem')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const loadPhotos = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError('Erro ao carregar fotos: ' + error.message)
    } else {
      setPhotos(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreviewUrl(URL.createObjectURL(f))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !price) {
      setError('Preencha todos os campos e selecione uma foto')
      return
    }

    setUploading(true)
    setError('')

    try {
      const ext = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          photographer_id: userId,
          title,
          description,
          price: parseFloat(price),
          category,
          image_url: urlData.publicUrl,
        })

      if (insertError) throw insertError

      // Reset form
      setTitle('')
      setDescription('')
      setPrice('')
      setFile(null)
      setPreviewUrl('')
      setShowUpload(false)

      // Reload photos
      loadPhotos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar foto')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', id)

    if (error) {
      setError('Erro ao excluir: ' + error.message)
    } else {
      setPhotos(photos.filter((p) => p.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sunset-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
            Meu Portfólio
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} no seu portfólio
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Upload className="h-4 w-4" />
          Enviar foto
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Upload form */}
      {showUpload && (
        <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                  Título da foto
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="Ex: Pôr do sol na Serra"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                >
                  {['Paisagem', 'Retrato', 'Urbano', 'Natureza', 'Esporte', 'Eventos', 'Comida', 'Animal', 'Arquitetura', 'Abstract'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper-50 px-4 py-2.5 text-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/20 dark:border-paper-100/10 dark:bg-ink-800 dark:text-paper-100"
                  placeholder="Descrição da foto"
                />
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-paper-100 mb-1.5">
                Arquivo da foto
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-500 hover:border-sunset-500 hover:text-sunset-500 dark:border-paper-100/20 dark:text-paper-200">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  {file ? file.name : 'Clique para selecionar uma foto'}
                </label>
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Publicar foto
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-xl border border-ink-900/10 px-6 py-2.5 text-sm text-ink-700 hover:bg-ink-100 dark:border-paper-100/10 dark:text-paper-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon className="h-12 w-12 text-ink-300" />
          <p className="mt-4 text-sm text-ink-500">
            Você ainda não tem fotos no portfólio.
          </p>
          <p className="text-xs text-ink-400">
            Clique em "Enviar foto" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden border border-ink-900/5 bg-paper-50 dark:border-paper-100/5 dark:bg-ink-900"
            >
              <div className="aspect-square relative">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 rounded-lg bg-red-500 p-1.5 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">
                  {photo.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-ink-500">{photo.category}</span>
                  <span className="text-sm font-mono font-semibold text-sunset-500">
                    R$ {photo.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}