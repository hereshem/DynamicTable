import { ArrowLeft, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import ContentForm from '../components/ContentForm';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import SortableHeader from '../components/SortableHeader';
import { contentAPI, schemaAPI } from '../services/api';
import { Content, CreateContentRequest, Schema, UpdateContentRequest } from '../types';

const TableView: React.FC = () => {
    const { tableSlug } = useParams<{ tableSlug: string }>();
    const navigate = useNavigate();

    const [schema, setSchema] = useState<Schema | null>(null);
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);

    // Search, filter, and sorting state
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [sortBy, setSortBy] = useState<string>('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page when searching
            fetchData();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, filters, sortBy, sortDir, currentPage, pageSize]);

    const fetchData = useCallback(async () => {
        if (!tableSlug) return;

        try {
            setLoading(true);

            // Fetch schema and contents in parallel
            const [schemaData, contentsResponse] = await Promise.all([
                schemaAPI.getBySlug(tableSlug),
                contentAPI.getAll(tableSlug, {
                    search: searchTerm,
                    filters: filters,
                    sortBy: sortBy,
                    sortDir: sortDir,
                    page: currentPage,
                    pageSize: pageSize
                })
            ]);

            if (!schemaData) {
                setError('Table not found');
                return;
            }

            setSchema(schemaData);
            setContents(contentsResponse.contents);
            setTotalItems(contentsResponse.total);
            setTotalPages(contentsResponse.totalPages);
        } catch (err) {
            setError('Failed to fetch table data');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [tableSlug, searchTerm, filters, sortBy, sortDir, currentPage, pageSize]);

    const handleCreate = async (data: CreateContentRequest) => {
        try {
            const newContent = await contentAPI.create(tableSlug!, data);
            setContents([newContent, ...contents]);
            setShowCreateForm(false);
            fetchData(); // Refresh to get updated counts
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create record');
        }
    };

    const handleUpdate = async (data: UpdateContentRequest) => {
        if (!editingContent) return;

        try {
            const updatedContent = await contentAPI.update(tableSlug!, editingContent.id, data);
            setContents(contents.map(content =>
                content.id === updatedContent.id ? updatedContent : content
            ));
            setShowEditForm(false);
            setEditingContent(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update record');
        }
    };

    const handleDelete = async (content: Content) => {
        if (!window.confirm('Are you sure you want to delete this record?')) {
            return;
        }

        try {
            await contentAPI.delete(tableSlug!, content.id);
            setContents(contents.filter(c => c.id !== content.id));
            fetchData(); // Refresh to get updated counts
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete record');
        }
    };

    const startEdit = (content: Content) => {
        setEditingContent(content);
        setShowEditForm(true);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
    };

    const handleFilterChange = (fieldName: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleClearFilters = () => {
        setFilters({});
    };

    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        setSortBy(field);
        setSortDir(direction);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const renderFieldValue = (fieldName: string, value: any, fieldType: string) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400">-</span>;
        }

        switch (fieldType) {
            case 'checkbox':
                return value ? 'Yes' : 'No';
            case 'date':
                return formatDate(value);
            case 'datetime':
                return new Date(value).toLocaleString();
            case 'file':
                return <a href={value} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View File</a>;
            default:
                return String(value);
        }
    };

    if (loading && !schema) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></Loader2>
                    <p className="mt-4 text-gray-600">Loading table...</p>
                </div>
            </div>
        );
    }

    if (error || !schema) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                    <p className="text-gray-600 mb-6">{error || 'Table not found'}</p>
                    <Button onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                size="sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{schema.tableName}</h1>
                                <p className="mt-2 text-gray-600">
                                    Table: {schema.tableSlug} • {totalItems} records
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setShowCreateForm(true)} size="lg">
                            <Plus className="w-5 h-5 mr-2" />
                            Add Record
                        </Button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="text-red-600">{error}</div>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Search and Filter Controls */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1 max-w-md">
                            <SearchBar
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                                placeholder={`Search in ${schema.tableName}...`}
                            />
                        </div>
                        <div className="flex items-center space-x-3">
                            <FilterPanel
                                fields={schema.fields}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={handleClearFilters}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Schema Info */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Table Structure</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schema.fields.map((field, index) => (
                            <div key={index} className="border border-gray-200 rounded-md p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">{field.label}</span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {field.dataType}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Name: {field.name}
                                    {field.required && <span className="text-red-500 ml-2">*Required</span>}
                                </p>
                                {field.options && field.options.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Options: {field.options.join(', ')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Records</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></Loader2>
                            <p className="mt-2 text-gray-600">Loading records...</p>
                        </div>
                    ) : contents.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                {searchTerm || Object.values(filters).some(v => v !== '')
                                    ? 'No records match your search criteria.'
                                    : 'No records found. Create your first record to get started.'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {schema.fields.map((field, index) => (
                                                <th
                                                    key={index}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    <SortableHeader
                                                        field={field.name}
                                                        label={field.label}
                                                        currentSortBy={sortBy}
                                                        currentSortDir={sortDir}
                                                        onSort={handleSort}
                                                    />
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {contents.map((content) => (
                                            <tr key={content.id} className="hover:bg-gray-50">
                                                {schema.fields.map((field, index) => (
                                                    <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {renderFieldValue(field.name, content.values[field.name], field.dataType)}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            onClick={() => startEdit(content)}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(content)}
                                                            variant="danger"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                            />
                        </>
                    )}
                </div>

                {/* Create Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Record</h3>
                                <ContentForm
                                    schema={schema}
                                    onSubmit={handleCreate}
                                    onCancel={() => setShowCreateForm(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Form Modal */}
                {showEditForm && editingContent && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Record</h3>
                                <ContentForm
                                    schema={schema}
                                    initialData={editingContent}
                                    onSubmit={handleUpdate}
                                    onCancel={() => {
                                        setShowEditForm(false);
                                        setEditingContent(null);
                                    }}
                                    isEditing
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableView;
