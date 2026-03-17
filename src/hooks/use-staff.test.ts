import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStaff, useCreateStaff } from './use-staff'
import React from 'react'

// Mock fetch
global.fetch = vi.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useStaff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch staff successfully', async () => {
    const mockStaff = [
      {
        id: '1',
        name: 'Mehmet Yılmaz',
        email: 'mehmet@example.com',
        phone: '5551234567',
        role: 'Berber',
        color: '#3B82F6',
        isActive: true,
      },
      {
        id: '2',
        name: 'Ahmet Demir',
        role: 'Kuaför',
        isActive: true,
      },
    ]

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStaff,
    })

    const { result } = renderHook(() => useStaff(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockStaff)
  })

  it('should handle fetch error', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useStaff(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Personeller yüklenirken hata oluştu')
  })
})

describe('useCreateStaff', () => {
  it('should create staff successfully', async () => {
    const mockResponse = { id: '3', name: 'Yeni Personel', role: 'Berber' }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateStaff(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      name: 'Yeni Personel',
      role: 'Berber',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })
})
