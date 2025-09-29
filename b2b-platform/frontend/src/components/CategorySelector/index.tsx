import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

// Импортируем глобальный тип Category и создаем локальный алиас
import { Category as GlobalCategory } from '../../types';

type Category = GlobalCategory;

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelect: (categoryId: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories = [],
  selectedCategoryId,
  onSelect,
  disabled = false,
  placeholder = "Выберите категорию"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Безопасное получение выбранной категории
  const getSelectedCategory = (): Category | null => {
    if (!selectedCategoryId || !Array.isArray(categories)) return null;

    const findCategory = (cats: Category[]): Category | null => {
      for (const cat of cats) {
        if (cat?.id === selectedCategoryId) return cat;
        if (cat?.children && Array.isArray(cat.children)) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findCategory(categories);
  };

  // Безопасная сортировка категорий
  const sortCategories = (cats: Category[]): Category[] => {
    if (!Array.isArray(cats)) return [];
    return [...cats].sort((a, b) => {
      if (!a?.name || !b?.name) return 0;
      return a.name.localeCompare(b.name, 'ru');
    });
  };

  // Безопасная фильтрация категорий
  const filterCategories = (cats: Category[], term: string): Category[] => {
    if (!term.trim() || !Array.isArray(cats)) return cats;

    const filtered: Category[] = [];

    for (const cat of cats) {
      if (!cat || typeof cat !== 'object' || !cat.name) continue;

      const matchesSearch = cat.name.toLowerCase().includes(term.toLowerCase());
      const categoryChildren = Array.isArray(cat.children) ? cat.children : [];
      const filteredChildren = filterCategories(categoryChildren, term);

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...cat,
          children: filteredChildren
        });
      }
    }

    return filtered;
  };

  // Переключение раскрытия категории
  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Безопасный выбор категории
  const handleCategorySelect = (categoryId: number) => {
    try {
      onSelect(categoryId);
      setIsOpen(false);
    } catch (error) {
      console.error('Ошибка при выборе категории:', error);
    }
  };


  // Безопасный рендер категории
  const renderCategory = (category: Category, level: number = 0): React.ReactNode => {
    if (!category || !category.id || !category.name) return null;

    const categoryChildren = Array.isArray(category.children) ? category.children : [];
    const hasChildren = categoryChildren.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = category.id === selectedCategoryId;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between px-3 py-2 hover:bg-dark-600 cursor-pointer transition-colors ${
            isSelected ? 'bg-primary-500/20 text-primary-400' : 'text-white'
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => handleCategorySelect(category.id)}
        >
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-sm">{category.name}</span>
          </div>

          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-1 hover:bg-dark-500 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-dark-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-dark-300" />
              )}
            </button>
          )}
        </div>

        {/* Подкатегории */}
        {hasChildren && isExpanded && (
          <div>
            {sortCategories(categoryChildren).map(child =>
              renderCategory(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const selectedCategory = getSelectedCategory();

  // Безопасная фильтрация корневых категорий
  const rootCategories = Array.isArray(categories)
    ? categories.filter(cat => cat && cat.id && (!cat.parent || cat.parent === null))
    : [];

  const filteredAndSortedCategories = sortCategories(
    filterCategories(rootCategories, searchTerm)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка выбора */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full input flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={selectedCategory ? 'text-white' : 'text-dark-400'}>
          {selectedCategory ? selectedCategory.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown меню */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Поле поиска */}
          <div className="p-3 border-b border-dark-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Поиск категорий..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm placeholder-dark-400 focus:outline-none focus:border-primary-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-dark-600 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-dark-400" />
                </button>
              )}
            </div>
          </div>

          {/* Список категорий */}
          <div className="max-h-60 overflow-y-auto">
            {filteredAndSortedCategories.length > 0 ? (
              filteredAndSortedCategories.map(category => renderCategory(category))
            ) : (
              <div className="p-4 text-center text-dark-400 text-sm">
                {searchTerm ? 'Категории не найдены' : 'Нет доступных категорий'}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default CategorySelector;