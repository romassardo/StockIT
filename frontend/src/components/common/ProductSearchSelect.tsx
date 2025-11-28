import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, X, Package } from 'lucide-react';
import { Product } from '../../types';

interface ProductSearchSelectProps {
  products: Product[];
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  products,
  selectedProductId,
  onProductSelect,
  disabled = false,
  placeholder = "Buscar producto...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Producto seleccionado - con verificación de id válido
  const selectedProduct = products.find(p => {
    const id = p.producto_id ?? p.id;
    if (id === undefined || id === null) return false;
    return id.toString() === selectedProductId;
  });

  // Filtrar productos basado en el término de búsqueda
  const filterProducts = useCallback((term: string) => {
    if (!term.trim()) {
      return products;
    }

    const searchLower = term.toLowerCase();
    return products.filter(product => {
      const marca = product.nombre_marca?.toLowerCase() || '';
      const nombre = product.nombre_producto.toLowerCase();
      const categoria = product.nombre_categoria.toLowerCase();
      const fullName = `${marca} ${nombre}`.trim().toLowerCase();
      
      return (
        fullName.includes(searchLower) ||
        nombre.includes(searchLower) ||
        marca.includes(searchLower) ||
        categoria.includes(searchLower)
      );
    });
  }, [products]);

  // Actualizar productos filtrados cuando cambia el término de búsqueda
  useEffect(() => {
    const filtered = filterProducts(searchTerm);
    setFilteredProducts(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, filterProducts]);

  // Actualizar productos filtrados cuando cambian los productos
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

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
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) {
          handleProductSelect(filteredProducts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll automático al elemento destacado
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleProductSelect = (product: Product) => {
    const id = product.producto_id ?? product.id;
    if (id === undefined || id === null) return;
    onProductSelect(id.toString());
    setIsOpen(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProductSelect('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  const formatProductName = (product: Product) => {
    return product.nombre_marca 
      ? `${product.nombre_marca} ${product.nombre_producto}`
      : product.nombre_producto;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedProduct ? formatProductName(selectedProduct) : '')}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={selectedProduct ? formatProductName(selectedProduct) : placeholder}
          className={`input-glass w-full pl-10 pr-10 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          autoComplete="off"
        />

        {/* Botones de acción */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selectedProduct && !disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors mr-1"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
            </button>
          )}
          <ChevronDown 
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {/* Información del producto seleccionado */}
      {selectedProduct && !isOpen && (
        <div className="mt-3 p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatProductName(selectedProduct)}
            </p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Categoría: {selectedProduct.nombre_categoria}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Stock actual: <span className="font-medium">{selectedProduct.cantidad_actual}</span> unidades
          </p>
        </div>
      )}

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {filteredProducts.length > 0 ? (
            <ul ref={listRef} className="py-1 overflow-y-auto max-h-60">
              {filteredProducts.map((product, index) => (
                <li
                  key={product.producto_id ?? product.id ?? `product-${index}`}
                  onClick={() => handleProductSelect(product)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                    index === highlightedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {formatProductName(product)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {product.nombre_categoria}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Stock: <span className="font-medium">{product.cantidad_actual}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No se encontraron productos
              </p>
              {searchTerm && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  para "{searchTerm}"
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchSelect; 