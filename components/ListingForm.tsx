'use client'
import { useState, useRef } from 'react'

export default function ListingForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  function clearImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    console.log('Form submitted!')
    setLoading(true)
    
    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      let imageUrl = null
      
      console.log('Form data:', Object.fromEntries(formData.entries()))

      // Upload image if selected
      if (selectedImage) {
        console.log('Uploading image...', selectedImage.name, selectedImage.type, selectedImage.size)
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedImage)
        uploadFormData.append('type', 'listing')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json()
          console.error('Upload failed:', errorData)
          alert(`Upload failed: ${errorData.error}`)
          return
        }
        
        const uploadData = await uploadRes.json()
        console.log('Upload response:', uploadData)

        if (uploadData.data?.url) {
          imageUrl = uploadData.data.url
          console.log('Image URL set to:', imageUrl)
        } else {
          console.error('No URL in upload response')
          alert('Image upload failed: No URL returned')
          return
        }
      }

      // Create listing
      console.log('Creating listing...')
      const data: any = Object.fromEntries(formData.entries())
      if (imageUrl) {
        data.imageUrl = imageUrl
      }
      console.log('Sending data:', data)

      const res = await fetch('/api/listings', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      })
      
      console.log('API response status:', res.status)
      
      if (res.ok) {
        console.log('Success! Redirecting...')
        window.location.href = '/'
      } else {
        const error = await res.json()
        console.error('API error:', error)
        alert(error.error || 'Failed to create listing')
      }
    } catch (error) {
      console.error('Failed to create listing:', error)
      alert('Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
  <input name="title" placeholder="Title" required className="w-full rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground placeholder:text-muted-foreground focus:border-primary" />
  <textarea name="description" placeholder="Description" required className="w-full rounded-xl border border-border bg-[var(--input-bg)] p-3 text-foreground placeholder:text-muted-foreground focus:border-primary" rows={5} />
      
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
        <label className="block text-sm font-medium">Product Image</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {imagePreview ? (
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-48 rounded-lg border-2 border-primary"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center hover:opacity-90"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary transition"
          >
            <div className="text-foreground-secondary">
              <span className="text-2xl block mb-2">📷</span>
              <span className="text-sm">Click to upload an image</span>
            </div>
          </button>
        )}
      </div>

      <button disabled={loading} className="w-full rounded-xl bg-primary px-5 py-3 text-white shadow-subtle hover:bg-primary-hover disabled:opacity-50">
        {loading ? 'Creating…' : 'Create Listing'}
      </button>
    </form>
  )
}
