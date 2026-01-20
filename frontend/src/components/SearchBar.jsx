import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import SearchResults from "./SearchResults";
import { searchItemsByName } from "../services/BillingService";
import { useSearch } from "../contexts/SearchContext";
import useAuthStore from "../store/AuthStore";

const SearchBar = forwardRef(
  (
    { onItemSelect, placeholder = "Search books by title, author, ISBN..." },
    ref,
  ) => {
    const storedLocationID = useAuthStore((s) => s.LocationID);
    const LocationID = storedLocationID ? parseInt(storedLocationID, 10) : 1;
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState(null);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const { registerSearchBar } = useSearch();

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      hideResults: () => {
        setShowResults(false);
        setSearchQuery("");
        setError(null);
      },
      focus: () => {
        searchInputRef.current?.focus();
      },
    }));

    // Register this SearchBar with the context
    useEffect(() => {
      registerSearchBar({
        hideResults: () => {
          setShowResults(false);
          setSearchQuery("");
          setError(null);
        },
      });
    }, [registerSearchBar]);

    // Debounce search function
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim().length >= 2) {
          handleSearch(searchQuery);
        } else {
          setSearchResults([]);
          setShowResults(false);
          setError(null);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          searchContainerRef.current &&
          !searchContainerRef.current.contains(event.target)
        ) {
          setShowResults(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleSearch = async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the actual inventory service
        const response = await searchItemsByName(query, LocationID);

        console.log("API Response:", response);

        // Check if response exists and has data
        if (!response || !response.data || !Array.isArray(response.data)) {
          console.warn("Invalid API response structure:", response);
          setSearchResults([]);
          setShowResults(true); // Show "No results found"
          return;
        }

        // Extract the data array from the API response
        const apiItems = response.data;

        // Check if array is empty
        if (apiItems.length === 0) {
          setSearchResults([]);
          setShowResults(true); // Show "No results found"
          return;
        }

        // Transform API response to match SearchResults component expectations
        const transformedResults = apiItems.map((item) => ({
          id: item.inventoryID,
          title: item.itemName,
          author: item.itemDescription,
          price: item.itemUnitPrice, // Remove /100 if prices are already in dollars
          cost_price: item.itemCostPrice, // Remove /100 if prices are already in dollars
          stock: 10, // Default stock since API doesn't provide this
          isbn:
            item.barcode && item.barcode.includes("ISBN") ? item.barcode : "",
          barcode: item.barcode,
          category: `Category ${item.itemCategory}`,
          image_url: item.itemImage || null,
          location_id: item.LocationID || item.locationID,
          inventory_id: item.inventoryID,
          created_date: item.createdDateTime,
          updated_date: item.updatedDateTime,
          supplier_ids: item.suplierID || [],
        }));

        setSearchResults(transformedResults);
        setShowResults(true);

        console.log("Transformed results:", transformedResults);
      } catch (error) {
        console.error("Search failed:", error);
        setError(error.message);

        // Fallback to mock data if API fails (for development)
        const mockResults = [
          {
            id: 1,
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            price: 15.99,
            stock: 5,
            isbn: "978-0-7432-7356-5",
            category: "Fiction",
            barcode: "978-0-7432-7356-5",
          },
          {
            id: 2,
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            price: 12.99,
            stock: 8,
            isbn: "978-0-06-112008-4",
            category: "Fiction",
            barcode: "978-0-06-112008-4",
          },
          {
            id: 3,
            title: "1984",
            author: "George Orwell",
            price: 13.99,
            stock: 12,
            isbn: "978-0-452-28423-4",
            category: "Science Fiction",
            barcode: "978-0-452-28423-4",
          },
        ].filter(
          (book) =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author.toLowerCase().includes(query.toLowerCase()) ||
            book.isbn.includes(query) ||
            book.barcode.includes(query),
        );

        setSearchResults(mockResults);
        setShowResults(true);
      } finally {
        setIsLoading(false);
      }
    };

    const handleItemSelect = (item) => {
      console.log("Selected item:", item);
      if (onItemSelect) {
        onItemSelect(item);
      }
      setShowResults(false);
      setSearchQuery("");
      setError(null);
      searchInputRef.current?.focus();
    };

    const handleInputFocus = () => {
      if (searchResults.length > 0) {
        setShowResults(true);
      }
    };

    const handleInputBlur = () => {
      // Delay hiding results to allow for clicks
      setTimeout(() => setShowResults(false), 200);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowResults(false);
        setSearchQuery("");
        setError(null);
        searchInputRef.current?.blur();
      }
    };

    return (
      <div ref={searchContainerRef} className="relative w-full">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition-colors ${
              error
                ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }`}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />

          {/* Search Icon or Loading Spinner */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && !isLoading && (
          <div className="absolute top-full left-0 right-0 bg-red-50 border border-red-200 rounded-b-lg p-3 z-50">
            <div className="flex items-center text-red-700">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">Search failed: {error}</span>
            </div>
          </div>
        )}

        {/* Search Results */}
        {showResults && !error && (
          <SearchResults
            results={searchResults}
            isLoading={isLoading}
            onItemSelect={handleItemSelect}
            searchQuery={searchQuery}
          />
        )}

        {/* Search Tips */}
        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <div className="absolute top-full left-0 right-0 bg-gray-50 border border-gray-200 rounded-b-lg p-3 z-50">
            <p className="text-sm text-gray-600">
              Type at least 2 characters to search...
            </p>
          </div>
        )}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
