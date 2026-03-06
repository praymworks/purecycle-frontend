import React, { useState, useMemo } from 'react';
import { Input, Select, Button, Badge } from './';

const Table = ({
  data = [],
  columns = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  actions,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter((row) =>
      columns.some((column) => {
        const value = column.accessor ? row[column.accessor] : '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Reset to page 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row);
    }
    
    const value = column.accessor ? row[column.accessor] : '';
    
    // Handle badge rendering
    if (column.type === 'badge') {
      return <Badge variant={column.badgeVariant?.(value) || 'default'}>{value}</Badge>;
    }
    
    return value;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Table Controls */}
      {(searchable || paginated) && (
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          {searchable && (
            <div className="flex-1 max-w-sm">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Page Size Selector */}
          {paginated && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                options={pageSizeOptions.map(size => ({ value: size, label: size.toString() }))}
                fullWidth={false}
                className="w-20"
              />
              <span className="text-sm text-gray-600">entries</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`
                        px-6 py-4 whitespace-nowrap text-sm text-gray-900
                        ${column.cellClassName || ''}
                      `}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Info */}
          <div className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>
            {' '}of{' '}
            <span className="font-medium">{filteredData.length}</span>
            {' '}entries
            {searchTerm && ` (filtered from ${data.length} total entries)`}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`
                    min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors
                    ${currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {page}
                </button>
              )
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
