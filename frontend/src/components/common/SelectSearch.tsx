import React, { useState, useEffect, useRef, useCallback } from 'react';
import Input from './Input'; // Usaremos nuestro Input personalizado
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export interface SelectOption {
  value: string | number;
  label: string;
  [key: string]: any; // Para permitir otras propiedades en las opciones
}

interface SelectSearchProps {
  options: SelectOption[];
  value?: SelectOption | null;
  onChange: (selected: SelectOption | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onInputChange?: (inputValue: string) => void; // Para búsqueda asíncrona si es necesario
  containerClassName?: string;
  isClearable?: boolean;
}

const SelectSearch: React.FC<SelectSearchProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  error,
  disabled = false,
  isLoading = false,
  onInputChange,
  containerClassName = '',
  isClearable = false,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState<string>('');
  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>(options);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setInputValue(value ? value.label : '');
    }
    setFilteredOptions(options);
  }, [options, value, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentInputValue = e.target.value;
    setInputValue(currentInputValue);
    setIsOpen(true);
    if (onInputChange) {
      onInputChange(currentInputValue);
    } else {
      const newFilteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(currentInputValue.toLowerCase())
      );
      setFilteredOptions(newFilteredOptions);
    }
  };

  const handleSelectOption = (option: SelectOption) => {
    onChange(option);
    setInputValue(option.label);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputValue('');
    setFilteredOptions(options);
    setIsOpen(false);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const dropdownBgColor = theme === 'dark' ? 'bg-slate-800/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md';
  const dropdownBorderColor = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
  const optionHoverBgColor = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100';
  const optionTextColor = theme === 'dark' ? 'text-slate-200' : 'text-gray-900';
  const selectedOptionBgColor = theme === 'dark' ? 'bg-primary-600/30' : 'bg-primary-500/10';

  return (
    <div ref={wrapperRef} className={`relative ${containerClassName}`}>
      <Input
        label={label}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        leftIcon={<FiSearch className={isLoading ? 'animate-pulse' : ''} />}
        rightIcon={ isClearable && inputValue && !disabled && !isLoading ? 
            <FiX onClick={handleClear} className="cursor-pointer" /> 
            : <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        }
        error={error}
        autoComplete="off"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      />
      {isOpen && !disabled && (
        <ul 
          className={`absolute z-10 w-full mt-1 ${dropdownBgColor} border ${dropdownBorderColor} rounded-xl shadow-lg max-h-60 overflow-auto py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
          role="listbox"
        >
          {isLoading ? (
            <li className={`px-4 py-2 ${optionTextColor}`}>Cargando...</li>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${optionTextColor} ${optionHoverBgColor} ${value?.value === option.value ? selectedOptionBgColor : ''}`}
                onClick={() => handleSelectOption(option)}
                role="option"
                aria-selected={value?.value === option.value}
              >
                <span className="block truncate">{option.label}</span>
              </li>
            ))
          ) : (
            <li className={`px-4 py-2 ${optionTextColor}`}>No hay opciones</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SelectSearch;
