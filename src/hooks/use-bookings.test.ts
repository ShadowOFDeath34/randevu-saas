import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBookings, useCreateBooking } from './use-bookings'
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

describe('useBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch bookings successfully', async () => {
    const mockBookings = [
      {
        id: '1',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '5551234567',
        serviceName: 'Saç Kesimi',
        staffName: 'Mehmet',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        status: 'confirmed',
        price: 150,
      },
    ]

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockBookings> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBookings,
    })

    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockBookings)
  })

  it('should handle fetch error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useBookings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Randevular yüklenirken hata oluştu')
  })
})

describe('useCreateBooking', () => {
  it('should create booking successfully', async () => {
    const mockResponse = { id: '1', success: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      customerName: 'Test User',
      customerPhone: '5551234567',
      serviceId: '1',
      staffId: '1',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })
})
