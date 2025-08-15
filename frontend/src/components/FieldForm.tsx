import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { DATA_TYPES, Field } from '../types';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface FieldFormProps {
    fields: Field[];
    onChange: (fields: Field[]) => void;
}

const FieldForm: React.FC<FieldFormProps> = ({ fields, onChange }) => {
    const addField = () => {
        const newField: Field = {
            name: '',
            label: '',
            dataType: 'text',
            dataValidation: '',
            required: false,
            options: [],
        };
        onChange([...fields, newField]);
    };

    const removeField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        onChange(newFields);
    };

    const updateField = (index: number, field: Partial<Field>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...field };
        onChange(newFields);
    };

    const addOption = (fieldIndex: number) => {
        const newFields = [...fields];
        if (!newFields[fieldIndex].options) {
            newFields[fieldIndex].options = [];
        }
        newFields[fieldIndex].options!.push('');
        onChange(newFields);
    };

    const removeOption = (fieldIndex: number, optionIndex: number) => {
        const newFields = [...fields];
        newFields[fieldIndex].options!.splice(optionIndex, 1);
        onChange(newFields);
    };

    const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
        const newFields = [...fields];
        newFields[fieldIndex].options![optionIndex] = value;
        onChange(newFields);
    };

    const dataTypeOptions = DATA_TYPES.map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1)
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Dynamic Fields</h3>
                <Button onClick={addField} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                </Button>
            </div>

            {fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-700">Field {index + 1}</h4>
                        <Button
                            onClick={() => removeField(index)}
                            variant="danger"
                            size="sm"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Field Name"
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            placeholder="e.g., firstName"
                            required
                        />

                        <Input
                            label="Field Label"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="e.g., First Name"
                            required
                        />

                        <Select
                            label="Data Type"
                            value={field.dataType}
                            onChange={(e) => updateField(index, { dataType: e.target.value })}
                            options={dataTypeOptions}
                        />

                        <Input
                            label="Validation Pattern (Regex)"
                            value={field.dataValidation || ''}
                            onChange={(e) => updateField(index, { dataValidation: e.target.value })}
                            placeholder="e.g., ^[a-zA-Z]+$"
                            helperText="Optional regex pattern for validation"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`required-${index}`} className="text-sm text-gray-700">
                            Required field
                        </label>
                    </div>

                    {(field.dataType === 'options' || field.dataType === 'radio' || field.dataType === 'checkbox') && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Options</label>
                                <Button
                                    onClick={() => addOption(index)}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>

                            {field.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={() => removeOption(index, optionIndex)}
                                        variant="danger"
                                        size="sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No fields added yet. Click "Add Field" to get started.</p>
                </div>
            )}
        </div>
    );
};

export default FieldForm;
