import React from 'react';
import './DataTable.css';

const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false, 
  onRowClick = null,
  pagination = null,
  caption = 'Data table',
  sortState = null, // { key, direction: 'asc' | 'desc' }
  onSort = null,
}) => {
  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="data-table-empty">
        <p>No data available</p>
      </div>
    );
  }

  const onRowKeyDown = (e, row) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick && onRowClick(row);
    }
  };

  const getSortAria = (col) => {
    if (!sortState || sortState.key !== col.key) return 'none';
    return sortState.direction === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column, index) => {
              const isSortable = !!onSort && !!column.key;
              const ariaSort = getSortAria(column);
              return (
                <th
                  key={index}
                  scope="col"
                  className={column.className || ''}
                  aria-sort={ariaSort}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className="th-sort"
                      aria-label={`Sort by ${column.header}`}
                      onClick={() => onSort(column.key)}
                    >
                      {column.header}
                      {sortState?.key === column.key && (
                        <span aria-hidden="true" className="sort-indicator">
                          {sortState.direction === 'asc' ? ' ▲' : ' ▼'}
                        </span>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              onKeyDown={(e) => onRowKeyDown(e, row)}
              className={onRowClick ? 'clickable' : ''}
              tabIndex={onRowClick ? 0 : -1}
              role={onRowClick ? 'button' : undefined}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={column.className || ''}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && (
        <div className="table-pagination">
          <span>
            Showing {pagination.start} to {pagination.end} of {pagination.total} entries
          </span>
          <div className="pagination-controls">
            <button 
              onClick={pagination.onPrevious} 
              disabled={!pagination.hasPrevious}
            >
              Previous
            </button>
            <span>Page {pagination.current}</span>
            <button 
              onClick={pagination.onNext} 
              disabled={!pagination.hasNext}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
