export interface Field {
    name: string;
    label: string;
    dataType: string;
    dataValidation?: string;
    required: boolean;
    options?: string[];
}

export interface Schema {
    id: string;
    tableSlug: string;
    tableName: string;
    fields: Field[];
    createdAt: string;
    updatedAt: string;
}

export interface Content {
    id: string;
    tableSlug: string;
    values: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSchemaRequest {
    tableName: string;
    tableSlug: string;
    fields: Field[];
}

export interface CreateContentRequest {
    values: Record<string, any>;
}

export interface UpdateSchemaRequest {
    tableName: string;
    fields: Field[];
}

export interface UpdateContentRequest {
    values: Record<string, any>;
}

// Search, Filter, and Sorting types
export interface ContentQueryParams {
    search?: string;
    filters?: Record<string, string>;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

export interface ContentResponse {
    contents: Content[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const DATA_TYPES = [
    'text',
    'number',
    'date',
    'time',
    'datetime',
    'file',
    'options',
    'checkbox',
    'radio',
    'textarea',
    'email',
    'url',
    'phone'
] as const;

export type DataType = typeof DATA_TYPES[number];
