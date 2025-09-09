import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronDown, Loader } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface CategoryAutocompleteProps {
  categories: Category[];
  selectedCategories: number[];
  onCategoriesChange: (categoryIds: number[]) => void;
  onCreateCategory?: (categoryName: string) => Promise<Category>;
  disabled?: boolean;
  placeholder?: string;
}

const CategoryAutocomplete: React.FC<CategoryAutocompleteProps> = ({
  categories,
  selectedCategories,
  onCategoriesChange,
  onCreateCategory,
  disabled = false,
  placeholder = "Начните вводить название категории...",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Фильтрация категорий при изменении поискового запроса
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedCategories.includes(category.id)
      );
      setFilteredCategories(filtered);
      setIsOpen(true);
    } else {
      setFilteredCategories([]);
      setIsOpen(false);
    }
  }, [searchTerm, categories, selectedCategories]);

  // Закрытие дропдауна при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Получить выбранные категории для отображения
  const getSelectedCategoriesData = () => {
    return selectedCategories
      .map(id => categories.find(cat => cat.id === id))
      .filter(Boolean) as Category[];
  };

  // Добавить категорию
  const handleAddCategory = (category: Category) => {
    if (!selectedCategories.includes(category.id)) {
      onCategoriesChange([...selectedCategories, category.id]);
      setSearchTerm('');
      setIsOpen(false);
      inputRef.current?.focus();
    }
  };

  // Удалить категорию
  const handleRemoveCategory = (categoryId: number) => {
    onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
  };

  // Создать новую категорию
  const handleCreateNewCategory = async (categoryName: string) => {
    if (!onCreateCategory || isCreating) return;
    
    try {
      setIsCreating(true);
      const newCategory = await onCreateCategory(categoryName.trim());
      
      // Добавляем новую категорию к выбранным
      onCategoriesChange([...selectedCategories, newCategory.id]);
      setSearchTerm('');
      setIsOpen(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Ошибка создания категории:', error);
      // Ошибка будет обработана в родительском компоненте через toast
    } finally {
      setIsCreating(false);
    }
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredCategories.length > 0) {
      e.preventDefault();
      handleAddCategory(filteredCategories[0]);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectedCategoriesData = getSelectedCategoriesData();

  return (
    <div className="space-y-4">
      {/* Поле ввода для поиска категорий */}
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <input
            ref={inputRef}
            id="category-search"
            name="categorySearch"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input pr-10"
            placeholder={disabled ? "Недоступно в режиме просмотра" : placeholder}
            disabled={disabled}
          />
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Подсказка о минимальном количестве символов */}
        {searchTerm.length > 0 && searchTerm.length < 3 && (
          <div className="absolute z-10 w-full mt-1 p-3 bg-dark-700 border border-dark-600 rounded-lg shadow-lg">
            <p className="text-dark-400 text-sm">
              Введите минимум 3 символа для поиска категорий...
            </p>
          </div>
        )}

        {/* Dropdown с результатами поиска */}
        {isOpen && filteredCategories.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleAddCategory(category)}
                className="flex items-center px-4 py-3 hover:bg-dark-600 cursor-pointer transition-colors border-b border-dark-600 last:border-b-0"
              >
                <Plus className="w-4 h-4 text-primary-400 mr-3" />
                <span className="text-white">{category.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Сообщение, если ничего не найдено + возможность создать новую */}
        {isOpen && filteredCategories.length === 0 && searchTerm.length >= 3 && (
          <div className="absolute z-10 w-full mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-lg">
            <div className="p-3">
              <p className="text-dark-400 text-sm mb-3">
                Категория "{searchTerm}" не найдена в списке.
              </p>
              
              {onCreateCategory ? (
                <>
                  <button
                    onClick={() => handleCreateNewCategory(searchTerm)}
                    disabled={isCreating}
                    className={`flex items-center w-full px-3 py-2 border border-green-500/30 rounded-lg transition-colors mb-3 ${
                      isCreating 
                        ? 'bg-green-600/10 text-green-400 cursor-not-allowed' 
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-300 hover:text-green-200'
                    }`}
                  >
                    {isCreating ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-sm">
                      {isCreating ? 'Создается...' : `Создать новую категорию "${searchTerm}"`}
                    </span>
                  </button>
                  <p className="text-dark-500 text-xs">
                    Новая категория будет доступна для всех пользователей после модерации.
                  </p>
                </>
              ) : (
                <p className="text-dark-500 text-sm">
                  Попробуйте изменить поисковый запрос или обратитесь к администратору для добавления новой категории.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Выбранные категории */}
      {selectedCategoriesData.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-3">
            Выбранные категории ({selectedCategoriesData.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedCategoriesData.map((category) => (
              <div
                key={category.id}
                className="flex items-center px-3 py-2 bg-primary-600/20 text-primary-300 rounded-full text-sm border border-primary-500/30"
              >
                <span>{category.name}</span>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveCategory(category.id)}
                    className="ml-2 hover:bg-primary-500/30 rounded-full p-1 transition-colors"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информационная подсказка */}
      {selectedCategoriesData.length === 0 && !disabled && (
        <p className="text-dark-400 text-sm">
          Начните вводить название категории для поиска. Минимум 3 символа.
        </p>
      )}
    </div>
  );
};

export default CategoryAutocomplete;