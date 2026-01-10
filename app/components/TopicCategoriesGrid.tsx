"use client";

import {
  DollarSign,
  Heart,
  Leaf,
  GraduationCap,
  Shield,
  Users,
  Home,
  Scale,
  Cpu,
  Landmark,
} from "lucide-react";

interface TopicCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const categories: TopicCategory[] = [
  { id: "economy", label: "Economy", icon: <DollarSign className="w-6 h-6" /> },
  { id: "healthcare", label: "Healthcare", icon: <Heart className="w-6 h-6" /> },
  { id: "climate", label: "Climate", icon: <Leaf className="w-6 h-6" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="w-6 h-6" /> },
  { id: "defense", label: "Defense", icon: <Shield className="w-6 h-6" /> },
  { id: "immigration", label: "Immigration", icon: <Users className="w-6 h-6" /> },
  { id: "housing", label: "Housing", icon: <Home className="w-6 h-6" /> },
  { id: "justice", label: "Justice", icon: <Scale className="w-6 h-6" /> },
  { id: "technology", label: "Technology", icon: <Cpu className="w-6 h-6" /> },
  { id: "governance", label: "Governance", icon: <Landmark className="w-6 h-6" /> },
];

interface TopicCategoriesGridProps {
  onCategoryClick?: (categoryId: string) => void;
  selectedCategory?: string | null;
}

export default function TopicCategoriesGrid({
  onCategoryClick,
  selectedCategory,
}: TopicCategoriesGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {categories.map((category: TopicCategory) => (
        <button
          key={category.id}
          onClick={() => onCategoryClick?.(category.id)}
          className={`
            flex flex-col items-center justify-center gap-2 p-4 rounded-xl
            border transition-all duration-200 cursor-pointer
            ${
              selectedCategory === category.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50 hover:scale-[1.02]"
            }
          `}
        >
          <div
            className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${
              selectedCategory === category.id
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }
          `}
          >
            {category.icon}
          </div>
          <span className="text-sm font-medium">{category.label}</span>
        </button>
      ))}
    </div>
  );
}
