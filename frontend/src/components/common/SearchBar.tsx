import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useNotification } from '../../contexts/NotificationContext';
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
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

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
      <div className="relative flex items-center">
        <label htmlFor="search-bar-input" className="sr-only">
          {`Búsqueda: ${placeholder}`}
        </label>
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D]" />
        <input
          type="text"
          id="search-bar-input"
          name="searchBar"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full p-2 pl-10 pr-10 border border-[#CED4DA] rounded-md focus:outline-none focus:border-[#3F51B5] focus:shadow-[0_0_0_3px_rgba(63,81,181,0.15)] text-[#212529]"
          data-testid="search-input"
          autoComplete="off"
          aria-label={`Búsqueda: ${placeholder}`}
          aria-describedby="search-bar-help"
        />
        <span id="search-bar-help" className="sr-only">
          Escriba términos de búsqueda y espere para ver resultados automáticamente
        </span>
        {showClearButton && searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] hover:text-[#495057] focus:outline-none"
            aria-label="Limpiar búsqueda"
            data-testid="clear-search-button"
          >
            <FiX />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
