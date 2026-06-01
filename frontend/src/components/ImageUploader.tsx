import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ImageUploaderProps {
  currentImage?: string
  onImageUploaded: (url: string) => void
}

export default function ImageUploader({ currentImage, onImageUploaded }: ImageUploaderProps) {
  const { token } = useAuth()
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      if (!token) return
      setError(null)

      // Client-side validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, and GIF images are allowed')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must not exceed 5MB')
        return
      }

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          setPreview(data.imageUrl)
          onImageUploaded(data.imageUrl)
        } else {
          const data = await res.json()
          setError(data.error || 'Upload failed')
          setPreview(currentImage || null)
        }
      } catch (err) {
        console.error('Upload error:', err)
        setError('Network error during upload')
        setPreview(currentImage || null)
      } finally {
        setUploading(false)
      }
    },
    [token, currentImage, onImageUploaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [uploadFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const clearImage = () => {
    setPreview(null)
    setError(null)
    onImageUploaded('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Product Image
      </label>

      {preview ? (
        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/30 group">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-foreground/30 hover:bg-accent/30'
          }`}
        >
          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs font-semibold text-foreground">
            {dragActive ? 'Drop image here' : 'Click or drag image'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            JPEG, PNG, WebP, GIF — Max 5MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <ImageIcon className="h-3 w-3 text-rose-500" />
          <span className="text-[10px] text-rose-500 font-medium">{error}</span>
        </div>
      )}
    </div>
  )
}
