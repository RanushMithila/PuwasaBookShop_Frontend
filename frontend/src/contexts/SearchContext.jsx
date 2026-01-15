import React, { createContext, useContext, useRef } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const searchBarRef = useRef(null);

  const hideSearchResults = () => {
    if (searchBarRef.current && searchBarRef.current.hideResults) {
      searchBarRef.current.hideResults();
    }
  };

  const registerSearchBar = (ref) => {
    searchBarRef.current = ref;
  };

  return (
    <SearchContext.Provider value={{ hideSearchResults, registerSearchBar }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
