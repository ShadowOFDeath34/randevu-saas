import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBookings, useCreateBooking, useBooking, useUpdateBooking, useDeleteBooking } from './use-bookings'
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

  it('should handle create booking error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<unknown> }) => void }).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Service unavailable' }),
    })

    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      customerName: 'Test User',
      customerPhone: '5551234567',
      serviceId: '1',
      staffId: '1',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
    })).rejects.toThrow('Randevu oluşturulurken hata oluştu')
  })
})

describe('useBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch single booking successfully', async () => {
    const mockBooking = {
      id: 'booking-1',
      customerName: 'Ahmet Yılmaz',
      customerPhone: '5551234567',
      serviceName: 'Saç Kesimi',
      staffName: 'Mehmet',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T11:00:00Z',
      status: 'confirmed',
      price: 150,
    }

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockBooking> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooking,
    })

    const { result } = renderHook(() => useBooking('booking-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockBooking)
    expect(fetch).toHaveBeenCalledWith('/api/bookings/booking-1')
  })

  it('should not fetch when id is empty', async () => {
    const { result } = renderHook(() => useBooking(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUpdateBooking', () => {
  it('should update booking successfully', async () => {
    const mockResponse = { id: 'booking-1', status: 'confirmed', notes: 'Updated' }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useUpdateBooking(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: 'booking-1',
      data: { status: 'confirmed', notes: 'Updated' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/bookings/booking-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })

  it('should handle update booking error with message', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<{ error: string }> }) => void }).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Slot already taken' }),
    })

    const { result } = renderHook(() => useUpdateBooking(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      id: 'booking-1',
      data: { status: 'confirmed' },
    })).rejects.toThrow('Slot already taken')
  })

  it('should handle update booking error without message', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<never> }) => void }).mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('Parse error') },
    })

    const { result } = renderHook(() => useUpdateBooking(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      id: 'booking-1',
      data: { status: 'confirmed' },
    })).rejects.toThrow('Randevu güncellenirken hata oluştu')
  })
})

describe('useDeleteBooking', () => {
  it('should delete booking successfully', async () => {
    const mockResponse = { id: 'booking-1', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useDeleteBooking(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('booking-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/bookings/booking-1', {
      method: 'DELETE',
    })
  })

  it('should handle delete booking error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useDeleteBooking(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('booking-1')).rejects.toThrow('Randevu silinirken hata oluştu')
  })
})

describe('useBookings with params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should include query params in request', async () => {
    const mockResponse = {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const params = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'confirmed' as const,
      staffId: 'staff-1',
      page: 2,
      limit: 10,
    }

    const { result } = renderHook(() => useBookings(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('startDate=2024-01-01'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('endDate=2024-01-31'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=confirmed'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('staffId=staff-1'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'))
  })
})
