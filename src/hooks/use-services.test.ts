import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useServices, useCreateService } from './use-services'
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

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch services successfully', async () => {
    const mockServices = [
      {
        id: '1',
        name: 'Saç Kesimi',
        description: 'Profesyonel saç kesimi',
        duration: 30,
        price: 150,
        color: '#3B82F6',
        isActive: true,
      },
      {
        id: '2',
        name: 'Sakal Traşı',
        duration: 15,
        price: 75,
        isActive: true,
      },
    ]

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockServices> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockServices,
    })

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockServices)
  })

  it('should handle fetch error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useServices(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Hizmetler yüklenirken hata oluştu')
  })
})

describe('useCreateService', () => {
  it('should create service successfully', async () => {
    const mockResponse = { id: '3', name: 'Yeni Hizmet', duration: 45, price: 200 }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      name: 'Yeni Hizmet',
      duration: 45,
      price: 200,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })
})
