import { ArrowLeft, Loader2, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import FieldForm from '../components/FieldForm';
import Input from '../components/Input';
import { schemaAPI } from '../services/api';
import { CreateSchemaRequest, Field, UpdateSchemaRequest } from '../types';

const CreateTable: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editSlug = searchParams.get('edit');

    const [formData, setFormData] = useState({
        tableName: '',
        tableSlug: '',
    });
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (editSlug) {
            setIsEditing(true);
            fetchSchema(editSlug);
        }
    }, [editSlug]);

    const fetchSchema = async (slug: string) => {
        try {
            setLoading(true);
            const schema = await schemaAPI.getBySlug(slug);
            if (schema) {
                setFormData({
                    tableName: schema.tableName,
                    tableSlug: schema.tableSlug,
                });
                setFields(schema.fields);
            }
        } catch (err) {
            console.error('Error fetching schema:', err);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.tableName.trim()) {
            newErrors.tableName = 'Table name is required';
        }

        if (!formData.tableSlug.trim()) {
            newErrors.tableSlug = 'Table slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.tableSlug)) {
            newErrors.tableSlug = 'Table slug can only contain lowercase letters, numbers, and hyphens';
        }

        if (fields.length === 0) {
            newErrors.fields = 'At least one field is required';
        }

        // Validate individual fields
        fields.forEach((field, index) => {
            if (!field.name.trim()) {
                newErrors[`field_${index}_name`] = 'Field name is required';
            } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
                newErrors[`field_${index}_name`] = 'Field name must start with a letter and contain only letters, numbers, and underscores';
            }

            if (!field.label.trim()) {
                newErrors[`field_${index}_label`] = 'Field label is required';
            }

            if (field.dataType === 'options' || field.dataType === 'radio' || field.dataType === 'checkbox') {
                if (!field.options || field.options.length === 0) {
                    newErrors[`field_${index}_options`] = 'Options are required for this field type';
                } else if (field.options.some(option => !option.trim())) {
                    newErrors[`field_${index}_options`] = 'All options must have values';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (isEditing) {
                const updateData: UpdateSchemaRequest = {
                    tableName: formData.tableName,
                    fields: fields,
                };
                await schemaAPI.update(formData.tableSlug, updateData);
            } else {
                const createData: CreateSchemaRequest = {
                    tableName: formData.tableName,
                    tableSlug: formData.tableSlug,
                    fields: fields,
                };
                await schemaAPI.create(createData);
            }

            navigate('/');
        } catch (err: any) {
            console.error('Error saving schema:', err);
            if (err.response?.data?.error) {
                setErrors({ submit: err.response.data.error });
            } else {
                setErrors({ submit: 'Failed to save table' });
            }
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData(prev => ({ ...prev, tableName: name }));

        // Auto-generate slug if not editing
        if (!isEditing && !formData.tableSlug) {
            setFormData(prev => ({ ...prev, tableSlug: generateSlug(name) }));
        }
    };

    if (loading && isEditing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></Loader2>
                    <p className="mt-4 text-gray-600">Loading table...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
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
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isEditing ? 'Edit Table' : 'Create New Table'}
                            </h1>
                            <p className="mt-2 text-gray-600">
                                {isEditing
                                    ? 'Modify the table structure and fields'
                                    : 'Define a new table with custom fields and validation'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {errors.submit && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="text-red-600">{errors.submit}</div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Table Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Table Name"
                                value={formData.tableName}
                                onChange={handleTableNameChange}
                                placeholder="e.g., Customer Information"
                                error={errors.tableName}
                                required
                            />

                            <Input
                                label="Table Slug"
                                value={formData.tableSlug}
                                onChange={(e) => setFormData(prev => ({ ...prev, tableSlug: e.target.value }))}
                                placeholder="e.g., customers"
                                error={errors.tableSlug}
                                helperText="URL-friendly identifier (lowercase, hyphens only)"
                                required
                                disabled={isEditing}
                            />
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <FieldForm fields={fields} onChange={setFields} />
                        {errors.fields && (
                            <p className="mt-2 text-sm text-red-600">{errors.fields}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            onClick={() => navigate('/')}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isEditing ? 'Update Table' : 'Create Table'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTable;
