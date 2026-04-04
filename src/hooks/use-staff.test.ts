import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from './use-staff'
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

    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockStaff> }) => void }).mockResolvedValueOnce({
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
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
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
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
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

  it('should handle create staff error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useCreateStaff(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      name: 'Yeni Personel',
      role: 'Berber',
    })).rejects.toThrow('Personel oluşturulurken hata oluştu')
  })

  it('should invalidate staff cache on success', async () => {
    const mockResponse = { id: '3', name: 'Yeni Personel', role: 'Berber' }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useCreateStaff(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync({
      name: 'Yeni Personel',
      role: 'Berber',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })

  it('should handle staff with optional fields', async () => {
    const mockResponse = {
      id: '4',
      name: 'Personel Detaylı',
      email: 'personel@example.com',
      phone: '5551234567',
      role: 'Kuaför',
      color: '#00ff00',
      isActive: true,
    }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateStaff(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      name: 'Personel Detaylı',
      email: 'personel@example.com',
      phone: '5551234567',
      role: 'Kuaför',
      color: '#00ff00',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useUpdateStaff', () => {
  it('should update staff successfully', async () => {
    const mockResponse = { id: '1', name: 'Güncel Personel', role: 'Kuaför', isActive: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useUpdateStaff(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: '1',
      data: { name: 'Güncel Personel', role: 'Kuaför' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/staff/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })

  it('should handle update staff error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useUpdateStaff(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      id: '1',
      data: { name: 'Güncel Personel' },
    })).rejects.toThrow('Personel güncellenirken hata oluştu')
  })

  it('should invalidate staff cache on update success', async () => {
    const mockResponse = { id: '1', name: 'Güncel Personel', role: 'Kuaför', isActive: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useUpdateStaff(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync({
      id: '1',
      data: { role: 'Kuaför' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })

  it('should handle partial update data', async () => {
    const mockResponse = { id: '2', name: 'Sadece Rol', role: 'Usta', isActive: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useUpdateStaff(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: '2',
      data: { role: 'Usta' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteStaff', () => {
  it('should delete staff successfully', async () => {
    const mockResponse = { id: '1', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useDeleteStaff(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/staff/1', {
      method: 'DELETE',
    })
  })

  it('should handle delete staff error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useDeleteStaff(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('1')).rejects.toThrow('Personel silinirken hata oluştu')
  })

  it('should invalidate staff cache on delete success', async () => {
    const mockResponse = { id: '1', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children)
    }

    const { result } = renderHook(() => useDeleteStaff(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync('staff-123')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['staff'] })
  })

  it('should handle different staff IDs', async () => {
    const mockResponse = { id: 'staff-abc-xyz', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useDeleteStaff(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('staff-abc-xyz')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/staff/staff-abc-xyz', {
      method: 'DELETE',
    })
  })
})
