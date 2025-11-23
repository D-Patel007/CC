'use client'
import { useState, useRef } from 'react'

const MAX_IMAGES = 5

export default function ListingForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [descriptionLength, setDescriptionLength] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    addImages(files)
  }

  function addImages(files: File[]) {
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    const remainingSlots = MAX_IMAGES - selectedImages.length
    const filesToAdd = validFiles.slice(0, remainingSlots)

    if (filesToAdd.length === 0) {
      if (validFiles.length === 0) {
        alert('Please select valid image files')
      } else {
        alert(`Maximum ${MAX_IMAGES} images allowed`)
      }
      return
    }

    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file))
    setSelectedImages(prev => [...prev, ...filesToAdd])
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index])
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    addImages(files)
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      let imageUrl: string | null = null

      const priceValue = formData.get('price')
      const parsedPrice = typeof priceValue === 'string' ? Number.parseFloat(priceValue) : NaN
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        alert('Please enter a valid, non-negative price')
        return
      }

      const priceCents = Math.round(parsedPrice * 100)

      // Upload images if selected
      const imageUrls: string[] = []
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', image)
          uploadFormData.append('type', 'listing')

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          })

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}))
            alert(`Upload failed: ${errorData.error || uploadRes.statusText}`)
            return
          }

          const uploadData = await uploadRes.json()

          if (uploadData.data?.url) {
            imageUrls.push(uploadData.data.url)
          } else {
            alert('Image upload failed: No URL returned')
            return
          }
        }
      }

      const title = formData.get('title')?.toString().trim() ?? ''
      const description = formData.get('description')?.toString().trim() ?? ''
      const condition = formData.get('condition')?.toString() ?? 'GOOD'
      const campusInput = formData.get('campus')?.toString().trim()
      const categoryIdRaw = formData.get('categoryId')?.toString()
      const categoryId = categoryIdRaw ? Number.parseInt(categoryIdRaw, 10) : null

      const payload = {
        title,
        description,
        condition,
        priceCents,
        categoryId: Number.isInteger(categoryId) ? categoryId : null,
        campus: campusInput ? campusInput : null,
        imageUrl: imageUrls[0] || null, // Keep backward compatibility
        images: imageUrls,
        imageCount: imageUrls.length,
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        window.location.href = '/'
      } else {
        const error = await res.json().catch(() => ({}))
        alert(error.error || 'Failed to create listing')
      }
    } catch (error) {
      alert('Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
  <input name="title" placeholder="Title" required className="w-full rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground placeholder:text-muted-foreground focus:border-primary" />
      <div>
        <textarea 
          name="description" 
          placeholder="Description" 
          required 
          onChange={(e) => setDescriptionLength(e.target.value.length)}
          className="w-full rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground placeholder:text-muted-foreground focus:border-primary" 
          rows={5} 
        />
        <p className="mt-1 text-xs text-foreground-secondary">
          {descriptionLength} / 5000 characters (minimum 10 required)
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
  <input name="price" type="number" step="0.01" placeholder="Price (USD)" required className="rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground placeholder:text-muted-foreground focus:border-primary" />
  <select name="condition" className="rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground focus:border-primary">
          <option value="NEW">New</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
          <option value="POOR">Poor</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
  <select name="categoryId" className="rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground focus:border-primary" required>
          <option value="">Select Category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
  <input name="campus" placeholder="Campus/Location (optional)" className="rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground placeholder:text-muted-foreground focus:border-primary" />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Product Images ({selectedImages.length}/{MAX_IMAGES})
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Image Previews Grid */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-lg border-2 border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-error text-white rounded-full w-7 h-7 flex items-center justify-center hover:opacity-90 opacity-0 group-hover:opacity-100 transition shadow-lg"
                  title="Remove image"
                >
                  ✕
                </button>
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Upload Button / Drop Zone */}
        {selectedImages.length < MAX_IMAGES && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary'
            }`}
          >
            <div className="text-foreground-secondary">
              <span className="text-3xl block mb-2">📷</span>
              <span className="text-sm block mb-1 font-medium">
                {imagePreviews.length === 0 ? 'Add product images' : 'Add more images'}
              </span>
              <span className="text-xs block">
                Drag and drop or click to browse (max {MAX_IMAGES})
              </span>
            </div>
          </div>
        )}
      </div>

      <button disabled={loading} className="w-full rounded-xl bg-primary px-5 py-3 text-white shadow-subtle hover:bg-primary-hover disabled:opacity-50">
        {loading ? 'Creating…' : 'Create Listing'}
      </button>
    </form>
  )
}
