import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SearchableOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  selectedId,
  onSelect,
  disabled = false,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  icon,
  className = "",
  emptyMessage = "No se encontraron resultados"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SearchableOption[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Opción seleccionada
  const selectedOption = options.find(opt => opt.id.toString() === selectedId);

  // Filtrar opciones basado en el término de búsqueda
  const filterOptions = useCallback((term: string) => {
    if (!term.trim()) {
      return options;
    }

    const searchLower = term.toLowerCase();
    return options.filter(opt => {
      const label = opt.label.toLowerCase();
      const sublabel = opt.sublabel?.toLowerCase() || '';
      return label.includes(searchLower) || sublabel.includes(searchLower);
    });
  }, [options]);

  // Actualizar opciones filtradas cuando cambia el término de búsqueda
  useEffect(() => {
    const filtered = filterOptions(searchTerm);
    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, filterOptions]);

  // Actualizar opciones filtradas cuando cambian las opciones
  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en el input cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll al elemento resaltado
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].id.toString());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Campo de selección */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2
          px-4 py-2.5 rounded-xl border transition-all text-left
          ${disabled 
            ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed opacity-60' 
            : 'bg-white dark:bg-slate-800 hover:border-indigo-300 cursor-pointer'
          }
          ${isOpen 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
            : 'border-slate-200 dark:border-slate-600'
          }
        `}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="text-slate-400 flex-shrink-0">{icon}</span>}
          <span className={`truncate ${selectedOption ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-xl overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <ul 
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.id}
                  onClick={() => handleSelect(opt.id.toString())}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    px-4 py-2 cursor-pointer transition-colors
                    ${highlightedIndex === index ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}
                    ${selectedId === opt.id.toString() ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}
                  `}
                  role="option"
                  aria-selected={selectedId === opt.id.toString()}
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {opt.sublabel}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
