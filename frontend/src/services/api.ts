import axios from 'axios';
import { Content, CreateContentRequest, CreateSchemaRequest, Schema, UpdateContentRequest, UpdateSchemaRequest } from '../types';

const API_BASE_URL = 'http://localhost:8085/api';

const api = axios.create({
    baseURL: API_BASE_URL,
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

    getAll: async (tableSlug: string): Promise<Content[]> => {
        const response = await api.get(`/contents/${tableSlug}`);
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
