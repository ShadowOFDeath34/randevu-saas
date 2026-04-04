import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCustomers, useCreateCustomer, useCustomer, useUpdateCustomer, useDeleteCustomer } from './use-customers'
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

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
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
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
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

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
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
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
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

  it('should handle create customer error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      name: 'Yeni Müşteri',
      phone: '5559998888',
    })).rejects.toThrow('Müşteri oluşturulurken hata oluştu')
  })
})

describe('useCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch single customer successfully', async () => {
    const mockCustomer = {
      id: 'cust-1',
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '5551234567',
      totalBookings: 5,
      createdAt: new Date().toISOString(),
    }

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockCustomer> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCustomer,
    })

    const { result } = renderHook(() => useCustomer('cust-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockCustomer)
    expect(fetch).toHaveBeenCalledWith('/api/customers/cust-1')
  })

  it('should not fetch when id is empty', async () => {
    const { result } = renderHook(() => useCustomer(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should handle fetch error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useCustomer('cust-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Müşteri detayları yüklenirken hata oluştu')
  })
})

describe('useUpdateCustomer', () => {
  it('should update customer successfully', async () => {
    const mockResponse = { id: 'cust-1', name: 'Güncel İsim', phone: '5551234567' }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useUpdateCustomer(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: 'cust-1',
      data: { name: 'Güncel İsim' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/customers/cust-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })

  it('should handle update error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useUpdateCustomer(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      id: 'cust-1',
      data: { name: 'Güncel İsim' },
    })).rejects.toThrow('Müşteri güncellenirken hata oluştu')
  })
})

describe('useDeleteCustomer', () => {
  it('should delete customer successfully', async () => {
    const mockResponse = { id: 'cust-1', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('cust-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/customers/cust-1', {
      method: 'DELETE',
    })
  })

  it('should handle delete error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('cust-1')).rejects.toThrow('Müşteri silinirken hata oluştu')
  })
})
