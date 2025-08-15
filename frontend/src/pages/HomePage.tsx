import { Edit, Eye, Plus, Table, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { schemaAPI } from '../services/api';
import { Schema } from '../types';

const HomePage: React.FC = () => {
    const [schemas, setSchemas] = useState<Schema[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSchemas();
    }, []);

    const fetchSchemas = async () => {
        try {
            setLoading(true);
            const data = await schemaAPI.getAll();
            setSchemas(data);
        } catch (err) {
            setError('Failed to fetch tables');
            console.error('Error fetching schemas:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tableSlug: string, tableName: string) => {
        if (!window.confirm(`Are you sure you want to delete the table "${tableName}"? This will also delete all its contents.`)) {
            return;
        }

        try {
            await schemaAPI.delete(tableSlug);
            setSchemas(schemas.filter(schema => schema.tableSlug !== tableSlug));
        } catch (err) {
            setError('Failed to delete table');
            console.error('Error deleting schema:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tables...</p>
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
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dynamic Tables</h1>
                            <p className="mt-2 text-gray-600">
                                Create and manage dynamic tables with custom fields
                            </p>
                        </div>
                        <Button onClick={() => navigate('/create')} size="lg">
                            <Plus className="w-5 h-5 mr-2" />
                            Create Table
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

                {/* Tables List */}
                {schemas.length === 0 ? (
                    <div className="text-center py-12">
                        <Table className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tables</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating your first dynamic table.
                        </p>
                        <div className="mt-6">
                            <Button onClick={() => navigate('/create')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Table
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {schemas.map((schema) => (
                                <li key={schema.id}>
                                    <div className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3">
                                                    <Table className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {schema.tableName}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Slug: {schema.tableSlug}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                                    <span>{schema.fields.length} fields</span>
                                                    <span>Created: {formatDate(schema.createdAt)}</span>
                                                    <span>Updated: {formatDate(schema.updatedAt)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    onClick={() => navigate(`/${schema.tableSlug}`)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                                <Button
                                                    onClick={() => navigate(`/create?edit=${schema.tableSlug}`)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(schema.tableSlug, schema.tableName)}
                                                    variant="danger"
                                                    size="sm"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
