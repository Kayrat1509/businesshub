import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Category } from '../../types';
import { 
  Building2, Laptop, Wrench, Car, Shirt, Home, 
  Utensils, Heart, GraduationCap, Briefcase, 
} from 'lucide-react';

interface CategoryGridProps {
  categories: Category[]
}

const CategoryGrid = ({ categories }: CategoryGridProps) => {
  // Icon mapping for categories
  const getIconForCategory = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    
    if (name.includes('строительств') || name.includes('недвижим')) {
return Building2;
}
    if (name.includes('it') || name.includes('компьютер') || name.includes('программ')) {
return Laptop;
}
    if (name.includes('оборудование') || name.includes('инструмент')) {
return Wrench;
}
    if (name.includes('автомобил') || name.includes('транспорт')) {
return Car;
}
    if (name.includes('одежд') || name.includes('текстил')) {
return Shirt;
}
    if (name.includes('мебель') || name.includes('интерьер')) {
return Home;
}
    if (name.includes('продукт') || name.includes('питан')) {
return Utensils;
}
    if (name.includes('медицин') || name.includes('здоров')) {
return Heart;
}
    if (name.includes('образован') || name.includes('обучен')) {
return GraduationCap;
}
    
    return Briefcase; // default icon
  };

  const colors = [
    'from-primary-600 to-primary-500',
    'from-secondary-600 to-secondary-500',
    'from-purple-600 to-purple-500',
    'from-green-600 to-green-500',
    'from-red-600 to-red-500',
    'from-yellow-600 to-yellow-500',
    'from-pink-600 to-pink-500',
    'from-indigo-600 to-indigo-500',
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {categories.map((category, index) => {
        const IconComponent = getIconForCategory(category.name);
        const gradientColor = colors[index % colors.length];
        
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to={`/category/${category.slug}`}
              className="block p-6 card hover:shadow-glow transition-all duration-300 group"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors">
                {category.name}
              </h3>
              
              {category.children && category.children.length > 0 && (
                <p className="text-dark-400 text-sm">
                  {category.children.length} подкатегорий
                </p>
              )}
              
              <div className="mt-3 text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Смотреть все →
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CategoryGrid;