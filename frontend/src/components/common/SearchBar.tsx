import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { SearchResult } from '../../types';

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  delay?: number;
  showClearButton?: boolean;
}

/**
 * Componente SearchBar reutilizable para búsquedas en toda la aplicación
 * Implementa un delay para evitar múltiples llamadas durante la escritura
 */
const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Búsqueda global...",
  className = '',
  initialValue = '',
  delay = 300,
  showClearButton = true
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState<string>(initialValue);

  // Actualizar valor si cambia desde fuera
  useEffect(() => {
    setSearchTerm(initialValue);
    setDebouncedTerm(initialValue);
  }, [initialValue]);

  // Debounce para evitar múltiples búsquedas mientras se escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Efectuar la búsqueda cuando cambia el término debounced
  useEffect(() => {
    onSearch(debouncedTerm);
  }, [debouncedTerm, onSearch]);

  // Manejar cambio en el input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Limpiar el campo de búsqueda
  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center group">
        <label htmlFor="search-bar-input" className="sr-only">
          {`Búsqueda: ${placeholder}`}
        </label>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-300 w-5 h-5" />
        <input
          type="text"
          id="search-bar-input"
          name="searchBar"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full py-3 pl-12 pr-10 bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 
                     text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
                     transition-all duration-300 backdrop-blur-sm shadow-sm"
          data-testid="search-input"
          autoComplete="off"
          aria-label={`Búsqueda: ${placeholder}`}
        />
        {showClearButton && searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors duration-200"
            aria-label="Limpiar búsqueda"
            data-testid="clear-search-button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
