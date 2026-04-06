'use client'

import { useState } from 'react'
import { Download, Upload, X, Check } from 'lucide-react'

interface Customer {
  id: string
  fullName: string
  phone: string
  email: string | null
}

interface ImportExportProps {
  customers: Customer[]
}

export default function ImportExportCustomers({ customers }: ImportExportProps) {
  const [showModal, setShowModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)

  const exportCustomers = () => {
    const csv = [
      ['Ad Soyad', 'Telefon', 'E-posta'].join(','),
      ...customers.map(c => 
        [c.fullName, c.phone, c.email || ''].map(field => 
          `"${field.replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `musteriler_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importCustomers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResults(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const nameIndex = headers.findIndex(h => h.includes('ad') || h.includes('name'))
      const phoneIndex = headers.findIndex(h => h.includes('tel') || h.includes('phone'))
      const emailIndex = headers.findIndex(h => h.includes('mail'))

      let success = 0
      let failed = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim())
        
        const name = values[nameIndex]
        const phone = values[phoneIndex]?.replace(/\D/g, '')
        const email = values[emailIndex]

        if (name && phone) {
          try {
            const res = await fetch('/api/customers/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fullName: name, phone, email })
            })
            
            if (res.ok) success++
            else failed++
          } catch {
            failed++
          }
        } else {
          failed++
        }
      }

      setResults({ success, failed })
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={exportCustomers}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Dışa Aktar
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Upload className="w-4 h-4" />
          İçe Aktar
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Müşteri İçe Aktar</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={importCustomers}
                className="hidden"
                id="import-file"
                disabled={importing}
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {importing ? 'İçe aktarılıyor...' : 'CSV dosyası seçin'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Format: Ad Soyad, Telefon, E-posta
                </p>
              </label>
            </div>

            {results && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">{results.success} müşteri eklendi</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <X className="w-4 h-4" />
                    <span>{results.failed} müşteri eklenemedi</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
