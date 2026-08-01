'use client'

import { useCallback, useState, type DragEvent, type ReactNode } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

type Props = {
  value?: File | null
  onFile: (file: File) => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function DropZone({
  value,
  onFile,
  accept = 'image/*',
  maxSizeMB = 50,
  className = '',
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const validateFile = useCallback((file: File): boolean => {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Tipo de arquivo inválido. Use apenas imagens.')
      return false
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setError(`Arquivo muito grande (${sizeMB.toFixed(1)} MB). Máximo ${maxSizeMB} MB.`)
      return false
    }

    return true
  }, [maxSizeMB])

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }, [validateFile, onFile])

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const hasFile = !!value || !!preview

  return (
    <div className={className}>
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
          isDragging
            ? 'border-sunset-500 bg-sunset-500/10 scale-[1.02]'
            : hasFile
              ? 'border-green-500 bg-green-500/5'
              : 'border-ink-200 bg-ink-100/30 hover:border-sunset-500 hover:bg-sunset-500/5 dark:border-paper-100/20 dark:bg-ink-800/30'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        {hasFile ? (
          <>
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="h-32 w-32 rounded-xl object-cover ring-2 ring-green-500/30"
              />
            )}
            {!preview && value && (
              <div className="h-32 w-32 rounded-xl bg-green-500/10 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-green-500" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {value?.name || 'Imagem selecionada'}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {value ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : 'Pronto para enviar'}
              </p>
            </div>
            <p className="text-xs text-ink-400">Clique ou arraste para trocar</p>
          </>
        ) : (
          <>
            <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
              isDragging
                ? 'bg-sunset-500 text-white scale-110'
                : 'bg-sunset-500/10 text-sunset-500 group-hover:bg-sunset-500/20'
            }`}>
              <Upload className={`h-7 w-7 transition-transform ${isDragging ? 'animate-bounce-soft' : ''}`} strokeWidth={1.75} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-ink-900 dark:text-paper-50">
                {isDragging ? 'Solte a foto aqui' : 'Arraste uma foto ou clique para selecionar'}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                PNG, JPG, WebP até {maxSizeMB} MB
              </p>
            </div>
          </>
        )}
      </label>

      {error && (
        <p className="mt-2 text-xs text-red-500 animate-page-enter">{error}</p>
      )}
    </div>
  )
}
