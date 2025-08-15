import { Filter, X } from 'lucide-react';
import React, { useState } from 'react';
import { Field } from '../types';
import Button from './Button';
import Input from './Input';
import Select from './Select';

interface FilterPanelProps {
    fields: Field[];
    filters: Record<string, string>;
    onFilterChange: (fieldName: string, value: string) => void;
    onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    fields,
    filters,
    onFilterChange,
    onClearFilters
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    const renderFilterInput = (field: Field) => {
        const value = filters[field.name] || '';

        switch (field.dataType) {
            case 'options':
            case 'radio':
            case 'checkbox':
                return (
                    <Select
                        label={field.label}
                        value={value}
                        onChange={(e) => onFilterChange(field.name, e.target.value)}
                        options={[
                            { value: '', label: 'All' },
                            ...(field.options?.map(option => ({ value: option, label: option })) || [])
                        ]}
                    />
                );
            case 'date':
                return (
                    <Input
                        label={field.label}
                        type="date"
                        value={value}
                        onChange={(e) => onFilterChange(field.name, e.target.value)}
                    />
                );
            case 'number':
                return (
                    <Input
                        label={field.label}
                        type="number"
                        value={value}
                        onChange={(e) => onFilterChange(field.name, e.target.value)}
                        placeholder={`Filter ${field.label}`}
                    />
                );
            default:
                return (
                    <Input
                        label={field.label}
                        value={value}
                        onChange={(e) => onFilterChange(field.name, e.target.value)}
                        placeholder={`Filter ${field.label}`}
                    />
                );
        }
    };

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                variant={hasActiveFilters ? "primary" : "outline"}
                size="sm"
                className="relative"
            >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                    <span className="ml-2 bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        {Object.values(filters).filter(v => v !== '').length}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {fields.map((field) => (
                            <div key={field.name}>
                                {renderFilterInput(field)}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <Button
                            onClick={onClearFilters}
                            variant="outline"
                            size="sm"
                        >
                            Clear All
                        </Button>
                        <Button
                            onClick={() => setIsOpen(false)}
                            size="sm"
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
