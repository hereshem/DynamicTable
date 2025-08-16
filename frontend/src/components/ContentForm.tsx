import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Content, CreateContentRequest, Field, Schema, UpdateContentRequest } from '../types';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface ContentFormProps {
    schema: Schema;
    initialData?: Content;
    onSubmit: (data: CreateContentRequest | UpdateContentRequest) => void;
    onCancel: () => void;
    isEditing?: boolean;
}

const ContentForm: React.FC<ContentFormProps> = ({
    schema,
    initialData,
    onSubmit,
    onCancel,
    isEditing = false
}) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [relatedData, setRelatedData] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            // For editing, populate form with existing data
            setFormData(initialData.values);
        } else {
            // For creating, initialize with empty values
            const initialValues: Record<string, any> = {};
            schema.fields.forEach(field => {
                switch (field.dataType) {
                    case 'checkbox':
                        initialValues[field.name] = false;
                        break;
                    case 'options':
                    case 'radio':
                        initialValues[field.name] = field.options?.[0] || '';
                        break;
                    default:
                        initialValues[field.name] = '';
                }
            });
            setFormData(initialValues);
        }
    }, [schema, initialData]);

    // Fetch related data for relational fields
    useEffect(() => {
        const fetchRelatedData = async () => {
            const relationFields = schema.fields.filter(field => field.dataType === 'relation');

            for (const field of relationFields) {
                if (field.relationConfig?.relatedTable) {
                    try {
                        setLoading(true);
                        const response = await api.get(`/contents/${field.relationConfig.relatedTable}`);
                        setRelatedData(prev => ({
                            ...prev,
                            [field.name]: response.data.contents || []
                        }));
                    } catch (error) {
                        console.error(`Failed to fetch related data for ${field.name}:`, error);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };

        fetchRelatedData();
    }, [schema]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        schema.fields.forEach(field => {
            const value = formData[field.name];

            if (field.required) {
                if (value === null || value === undefined || value === '') {
                    newErrors[field.name] = `${field.label} is required`;
                }
            }

            if (value && field.dataValidation) {
                try {
                    const regex = new RegExp(field.dataValidation);
                    if (!regex.test(String(value))) {
                        newErrors[field.name] = `${field.label} format is invalid`;
                    }
                } catch (err) {
                    console.warn('Invalid regex pattern:', field.dataValidation);
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData = {
            values: formData
        };

        onSubmit(submitData);
    };

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));

        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
    };

    const renderField = (field: Field) => {
        const value = formData[field.name];
        const error = errors[field.name];

        switch (field.dataType) {
            case 'textarea':
                return (
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            value={value || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                                }`}
                            rows={3}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={field.name}
                            checked={value || false}
                            onChange={(e) => handleInputChange(field.name, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {error && <p className="ml-2 text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'radio':
                return (
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="space-y-2">
                            {field.options?.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id={`${field.name}_${index}`}
                                        name={field.name}
                                        value={option}
                                        checked={value === option}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`${field.name}_${index}`} className="text-sm text-gray-700">
                                        {option}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'options':
                return (
                    <Select
                        label={field.label}
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        options={field.options?.map(option => ({ value: option, label: option })) || []}
                        error={error}
                        required={field.required}
                    />
                );

            case 'date':
                return (
                    <Input
                        label={field.label}
                        type="date"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'time':
                return (
                    <Input
                        label={field.label}
                        type="time"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'datetime':
                return (
                    <Input
                        label={field.label}
                        type="datetime-local"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'file':
                return (
                    <Input
                        label={field.label}
                        type="file"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                // In a real app, you'd upload the file and get a URL
                                handleInputChange(field.name, URL.createObjectURL(file));
                            }
                        }}
                        error={error}
                        required={field.required}
                    />
                );

            case 'number':
                return (
                    <Input
                        label={field.label}
                        type="number"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || '')}
                        error={error}
                        required={field.required}
                    />
                );

            case 'email':
                return (
                    <Input
                        label={field.label}
                        type="email"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'url':
                return (
                    <Input
                        label={field.label}
                        type="url"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'phone':
                return (
                    <Input
                        label={field.label}
                        type="tel"
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );

            case 'relation':
                const options = relatedData[field.name] || [];
                const displayField = field.relationConfig?.displayField || 'id';
                const relatedField = field.relationConfig?.relatedField || 'id';

                return (
                    <Select
                        label={field.label}
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        options={options.map(item => ({
                            value: item.values[relatedField],
                            label: item.values[displayField] || 'Unknown'
                        }))}
                        error={error}
                        required={field.required}
                        disabled={loading}
                    />
                );

            default: // text
                return (
                    <Input
                        label={field.label}
                        value={value || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        error={error}
                        required={field.required}
                    />
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schema.fields.map((field, index) => (
                    <div key={index} className={field.dataType === 'textarea' || field.dataType === 'checkbox' || field.dataType === 'radio' ? 'md:col-span-2' : ''}>
                        {renderField(field)}
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button type="button" onClick={onCancel} variant="outline">
                    Cancel
                </Button>
                <Button type="submit">
                    {isEditing ? 'Update Record' : 'Create Record'}
                </Button>
            </div>
        </form>
    );
};

export default ContentForm;
