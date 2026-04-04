import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useServices, useCreateService, useUpdateService, useDeleteService } from './use-services'
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

  it('should handle create service error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      name: 'Yeni Hizmet',
      duration: 45,
      price: 200,
    })).rejects.toThrow('Hizmet oluşturulurken hata oluştu')
  })

  it('should invalidate services cache on success', async () => {
    const mockResponse = { id: '3', name: 'Yeni Hizmet', duration: 45, price: 200 }
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

    const { result } = renderHook(() => useCreateService(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync({
      name: 'Yeni Hizmet',
      duration: 45,
      price: 200,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['services'] })
  })

  it('should handle service with optional fields', async () => {
    const mockResponse = {
      id: '4',
      name: 'Hizmet Açıklamalı',
      description: 'Detaylı açıklama',
      duration: 60,
      price: 300,
      color: '#00ff00',
      isActive: true
    }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useCreateService(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      name: 'Hizmet Açıklamalı',
      description: 'Detaylı açıklama',
      duration: 60,
      price: 300,
      color: '#00ff00',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useUpdateService', () => {
  it('should update service successfully', async () => {
    const mockResponse = { id: '1', name: 'Güncel Hizmet', duration: 30, price: 175, isActive: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: '1',
      data: { name: 'Güncel Hizmet', price: 175 },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/services/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    })
  })

  it('should handle update service error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync({
      id: '1',
      data: { name: 'Güncel Hizmet' },
    })).rejects.toThrow('Hizmet güncellenirken hata oluştu')
  })

  it('should invalidate services cache on update success', async () => {
    const mockResponse = { id: '1', name: 'Güncel Hizmet', duration: 30, price: 175, isActive: true }
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

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync({
      id: '1',
      data: { price: 175 },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['services'] })
  })

  it('should handle partial update data', async () => {
    const mockResponse = { id: '2', name: 'Sadece Fiyat', duration: 30, price: 500, isActive: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useUpdateService(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      id: '2',
      data: { price: 500 },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteService', () => {
  it('should delete service successfully', async () => {
    const mockResponse = { id: '1', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/services/1', {
      method: 'DELETE',
    })
  })

  it('should handle delete service error', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean }) => void }).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    })

    await expect(result.current.mutateAsync('1')).rejects.toThrow('Hizmet silinirken hata oluştu')
  })

  it('should invalidate services cache on delete success', async () => {
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

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: Wrapper,
    })

    await result.current.mutateAsync('service-123')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['services'] })
  })

  it('should handle different service IDs', async () => {
    const mockResponse = { id: 'abc-123-xyz', deleted: true }
    ;(fetch as unknown as { mockResolvedValueOnce: (value: { ok: boolean; json: () => Promise<typeof mockResponse> }) => void }).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync('abc-123-xyz')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/services/abc-123-xyz', {
      method: 'DELETE',
    })
  })
})
