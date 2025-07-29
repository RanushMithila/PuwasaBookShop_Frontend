import { useState } from 'react';

const SearchResults = ({ 
  results = [], 
  isLoading = false, 
  onItemSelect, 
  searchQuery = '' 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Handle keyboard navigation
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      handleItemSelect(results[index]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, -1));
    }
  };

  const handleItemSelect = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Searching...</p>
        </div>
      </div>
    );
  }

  // No results
  if (!isLoading && results.length === 0 && searchQuery) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-50">
        <div className="p-4 text-center text-gray-500">
          <div className="text-4xl mb-2">📚</div>
          <p>No books found for "{searchQuery}"</p>
          <p className="text-sm">Try searching with different keywords</p>
        </div>
      </div>
    );
  }

  // Show results
  if (results.length > 0) {
    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        <div className="p-2">
          <div className="text-xs text-gray-500 px-3 py-2 border-b">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          
          {results.map((item, index) => (
            <div
              key={item.id || item.barcode || index}
              className={`
                flex items-center p-3 cursor-pointer border-b border-gray-100 last:border-b-0
                hover:bg-blue-50 transition-colors duration-150
                ${selectedIndex === index ? 'bg-blue-50 border-blue-200' : ''}
              `}
              onClick={() => handleItemSelect(item)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
            >
              {/* Book Cover/Image */}
              <div className="flex-shrink-0 w-12 h-16 bg-gray-100 rounded mr-3 flex items-center justify-center">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`text-2xl ${item.image_url ? 'hidden' : 'flex'}`}
                  style={{ display: item.image_url ? 'none' : 'flex' }}
                >
                  📖
                </div>
              </div>

              {/* Book Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-2">
                    {/* Title */}
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.title || 'Unknown Title'}
                    </h3>
                    
                    {/* Author */}
                    <p className="text-sm text-gray-600 truncate">
                      by {item.author || 'Unknown Author'}
                    </p>
                    
                    {/* ISBN/Barcode */}
                    {item.isbn && (
                      <p className="text-xs text-gray-500">
                        ISBN: {item.isbn}
                      </p>
                    )}
                    
                    {item.barcode && (
                      <p className="text-xs text-gray-500">
                        Barcode: {item.barcode}
                      </p>
                    )}

                    {/* Stock Status */}
                    <div className="flex items-center mt-1">
                      <span 
                        className={`
                          inline-block w-2 h-2 rounded-full mr-1
                          ${item.stock > 10 ? 'bg-green-500' : 
                            item.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}
                        `}
                      ></span>
                      <span className="text-xs text-gray-600">
                        Stock: {item.stock || 0}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-green-600">
                      ${(item.price || 0).toFixed(2)}
                    </div>
                    {item.discount_price && item.discount_price < item.price && (
                      <div className="text-xs text-gray-500 line-through">
                        ${item.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category/Genre */}
                {item.category && (
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {item.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Icon */}
              <div className="flex-shrink-0 ml-2 text-gray-400">
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-t">
          Use ↑↓ arrows to navigate, Enter to select
        </div>
      </div>
    );
  }

  // Don't render anything if no search query and no results
  return null;
};

export default SearchResults;