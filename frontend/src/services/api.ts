import axios from 'axios';
import { Content, ContentQueryParams, ContentResponse, CreateContentRequest, CreateSchemaRequest, Schema, UpdateContentRequest, UpdateSchemaRequest } from '../types';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Schema API calls
export const schemaAPI = {
    create: async (data: CreateSchemaRequest): Promise<Schema> => {
        const response = await api.post('/schemas', data);
        return response.data;
    },

    getAll: async (): Promise<Schema[]> => {
        const response = await api.get('/schemas');
        return response.data;
    },

    getBySlug: async (tableSlug: string): Promise<Schema> => {
        const response = await api.get(`/schemas/${tableSlug}`);
        return response.data;
    },

    update: async (tableSlug: string, data: UpdateSchemaRequest): Promise<Schema> => {
        const response = await api.put(`/schemas/${tableSlug}`, data);
        return response.data;
    },

    delete: async (tableSlug: string): Promise<void> => {
        await api.delete(`/schemas/${tableSlug}`);
    },
};

// Content API calls
export const contentAPI = {
    create: async (tableSlug: string, data: CreateContentRequest): Promise<Content> => {
        const response = await api.post(`/contents/${tableSlug}`, data);
        return response.data;
    },

    getAll: async (tableSlug: string, params?: ContentQueryParams): Promise<ContentResponse> => {
        const queryParams = new URLSearchParams();

        if (params?.search) {
            queryParams.append('search', params.search);
        }

        if (params?.filters) {
            const filterPairs = Object.entries(params.filters)
                .filter(([_, value]) => value !== '')
                .map(([key, value]) => `${key}=${value}`);
            if (filterPairs.length > 0) {
                queryParams.append('filters', filterPairs.join(','));
            }
        }

        if (params?.sortBy) {
            queryParams.append('sortBy', params.sortBy);
        }

        if (params?.sortDir) {
            queryParams.append('sortDir', params.sortDir);
        }

        if (params?.page) {
            queryParams.append('page', params.page.toString());
        }

        if (params?.pageSize) {
            queryParams.append('pageSize', params.pageSize.toString());
        }

        const url = `/contents/${tableSlug}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return response.data;
    },

    getById: async (tableSlug: string, id: string): Promise<Content> => {
        const response = await api.get(`/contents/${tableSlug}/${id}`);
        return response.data;
    },

    update: async (tableSlug: string, id: string, data: UpdateContentRequest): Promise<Content> => {
        const response = await api.put(`/contents/${tableSlug}/${id}`, data);
        return response.data;
    },

    delete: async (tableSlug: string, id: string): Promise<void> => {
        await api.delete(`/contents/${tableSlug}/${id}`);
    },
};

export default api;
