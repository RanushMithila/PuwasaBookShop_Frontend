import React, { useState, useEffect } from "react";
import debounce from "lodash.debounce";
import { searchItemsByName, getItemQuantity } from "../services/BillingService";

const SearchByNameModal = ({ isOpen, onClose, onSelectItem }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const search = async (name) => {
    if (!name || name.length < 4) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const nameResp = await searchItemsByName(name, 1);
      if (
        nameResp &&
        nameResp.status === true &&
        Array.isArray(nameResp.data)
      ) {
        const itemsWithQuantity = await Promise.all(
          nameResp.data.map(async (item) => {
            try {
              const quantityResp = await getItemQuantity(item.barcode, 1);
              const quantity = quantityResp?.data?.[0]?.quantity ?? 0;
              return { ...item, quantity };
            } catch (err) {
              console.error(`Failed to get quantity for ${item.barcode}`, err);
              return { ...item, quantity: "N/A" };
            }
          })
        );
        setResults(itemsWithQuantity);
        setHighlightIndex(0);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Name search failed:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debouncedSearch = debounce(search, 300);
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
      setHighlightIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (!isOpen || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(results.length - 1, prev + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter") {
        if (highlightIndex >= 0 && results[highlightIndex]) {
          e.preventDefault();
          handleSelectItem(results[highlightIndex]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, results, highlightIndex]);

  const handleSelectItem = (item) => {
    onSelectItem(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[640px] max-h-[540px] border border-gray-100 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Search by Name
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
          className="border px-3 py-2 w-full text-base rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4 uppercase"
          placeholder="Type to search..."
          autoFocus
        />

        <div className="overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="text-center py-16 text-gray-500">Loading...</div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((item, idx) => (
                <div
                  key={item.inventoryID}
                  className={`p-3 rounded-xl uppercase ${
                    highlightIndex === idx ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="font-semibold">{item.itemName}</div>
                  <div className="text-xs text-gray-600">
                    Location:{" "}
                    <span className="text-lg font-bold">{item.locationID}</span>{" "}
                    | Rs: {item.itemUnitPrice} | Qty: {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              No results found.
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchByNameModal;
