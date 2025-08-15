import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import React from 'react';

interface SortableHeaderProps {
    field: string;
    label: string;
    currentSortBy?: string;
    currentSortDir?: 'asc' | 'desc';
    onSort: (field: string, direction: 'asc' | 'desc') => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
    field,
    label,
    currentSortBy,
    currentSortDir,
    onSort
}) => {
    const isCurrentSort = currentSortBy === field;

    const handleSort = () => {
        let newDirection: 'asc' | 'desc' = 'asc';

        if (isCurrentSort) {
            newDirection = currentSortDir === 'asc' ? 'desc' : 'asc';
        }

        onSort(field, newDirection);
    };

    const renderSortIcon = () => {
        if (!isCurrentSort) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
        }

        if (currentSortDir === 'asc') {
            return <ChevronUp className="w-4 h-4 text-blue-600" />;
        }

        return <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    return (
        <button
            onClick={handleSort}
            className="group flex items-center space-x-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 py-1"
        >
            <span>{label}</span>
            <div className="flex-shrink-0">
                {renderSortIcon()}
            </div>
        </button>
    );
};

export default SortableHeader;
