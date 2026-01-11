"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/browser";

interface TopicCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface QuestionTemplate {
  id: string;
  question_text: string;
  category: string;
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
  onQuestionClick?: (questionText: string) => void;
  highlightedTopics?: string[];
}

export default function TopicCategoriesGrid({
  onQuestionClick,
  highlightedTopics = [],
}: TopicCategoriesGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedCategory) {
      setQuestions([]);
      return;
    }

    async function fetchQuestions() {
      setIsLoading(true);
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("question_templates")
          .select("id, question_text, category")
          .ilike("category", selectedCategory!)
          .order("display_order", { ascending: true })
          .limit(6);

        if (error) throw error;
        setQuestions(data || []);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const selectedCategoryLabel = categories.find(c => c.id === selectedCategory)?.label;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category: TopicCategory) => {
          const isHighlighted = highlightedTopics.includes(category.id);
          const isSelected = selectedCategory === category.id;
          
          return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-xl
              border-2 transition-all duration-200 cursor-pointer relative
              ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : isHighlighted
                  ? "border-accent ring-2 ring-accent/30 bg-accent/5 hover:scale-[1.02]"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50 hover:scale-[1.02]"
              }
            `}
          >
            <div
              className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${
                isSelected
                  ? "bg-primary/10 text-primary"
                  : isHighlighted
                  ? "bg-accent/10 text-accent"
                  : "bg-muted text-muted-foreground"
              }
            `}
            >
              {category.icon}
            </div>
            <span className="text-sm font-medium">{category.label}</span>
            {isHighlighted && !isSelected && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent" />
            )}
          </button>
        );
        })}
      </div>

      {selectedCategory && (
        <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Example {selectedCategoryLabel} questions:
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((q: QuestionTemplate) => (
                <button
                  key={q.id}
                  onClick={() => onQuestionClick?.(q.question_text)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors cursor-pointer"
                >
                  {q.question_text}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              No questions available for this category.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
