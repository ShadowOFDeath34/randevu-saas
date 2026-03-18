'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface Customer {
  id: string
  fullName: string
  phone: string
  email: string | null
  tags: string[]
}

interface Props {
  customer: Customer
  onUpdate: (tags: string[]) => void
}

export default function CustomerTags({ customer, onUpdate }: Props) {
  const [showInput, setShowInput] = useState(false)
  const [newTag, setNewTag] = useState('')

  const availableTags = ['VIP', 'Düzenli', 'Yeni Müşteri', 'Potansiyel', 'Takip', 'Sorunlu', 'Ödeme Güçlüğü']

  const addTag = (tag: string) => {
    if (tag && !customer.tags.includes(tag)) {
      onUpdate([...customer.tags, tag])
    }
    setNewTag('')
    setShowInput(false)
  }

  const removeTag = (tag: string) => {
    onUpdate(customer.tags.filter(t => t !== tag))
  }

  return (
    <div className="flex flex-wrap gap-2">
      {customer.tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
        >
          {tag}
          <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {showInput ? (
        <div className="flex items-center gap-1">
          <select
            value={newTag}
            onChange={(e) => addTag(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Etiket seç...</option>
            {availableTags.filter(t => !customer.tags.includes(t)).map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <button onClick={() => setShowInput(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-xs hover:border-gray-400"
        >
          <Plus className="w-3 h-3" />
          Etiket
        </button>
      )}
    </div>
  )
}
