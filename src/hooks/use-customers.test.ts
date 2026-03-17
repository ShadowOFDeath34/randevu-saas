import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCustomers, useCreateCustomer } from './use-customers'
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

describe('useCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch customers successfully', async () => {
    const mockResponse = {
      customers: [
        {
          id: '1',
          name: 'Ahmet Yılmaz',
          email: 'ahmet@example.com',
          phone: '5551234567',
          totalBookings: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Mehmet Demir',
          phone: '5559876543',
          totalBookings: 2,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    }

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockResponse)
  })

  it('should handle fetch error', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Müşteriler yüklenirken hata oluştu')
  })

  it('should include search params in request', async () => {
    const mockResponse = { customers: [], total: 0, page: 1, totalPages: 0 }

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const params = { search: 'Ahmet', page: 1, limit: 10 }
    const { result } = renderHook(() => useCustomers(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/customers?search=Ahmet&page=1&limit=10')
  })
})

describe('useCreateCustomer', () => {
  it('should create customer successfully', async () => {
    const mockResponse = { id: '3', name: 'Yeni Müşteri', phone: '5559998888' }
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      name: 'Yeni Müşteri',
      phone: '5559998888',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })
})
