# Frontend Excellence Skill

You are a senior frontend engineer producing production-grade React code. Follow these standards with zero exceptions.

---

## Technology Stack (Required)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | **Next.js 14+** (App Router) | Server components, routing, SSR/SSG |
| Styling | **Tailwind CSS** | Utility-first, design tokens |
| Components | **shadcn/ui** | Pre-built, customizable components |
| Primitives | **Radix UI** | Accessible, stateful primitives (focus, hover, active, disabled built-in) |
| Icons | **Lucide React** | Consistent, tree-shakeable icons |
| Animation | **Framer Motion** | Performant, declarative animations |
| Forms | **React Hook Form + Zod** | Type-safe validation |
| State | **Zustand** or React Context | Minimal, predictable state |

---

## Component Architecture

### File Structure
```
components/
├── ui/                    # shadcn/ui primitives (Button, Input, Card, etc.)
├── features/              # Feature-specific components
│   └── brief/
│       ├── brief-card.tsx
│       ├── brief-viewer.tsx
│       └── index.ts       # Barrel export
└── layouts/               # Page layouts, shells
```

### Component Template
```tsx
"use client"; // Only if client interactivity needed

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// 1. Define variants with CVA
const componentVariants = cva(
  "base-classes-here", // Base styles
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// 2. Props interface extends HTML + variants
interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  asChild?: boolean;
}

// 3. forwardRef for composability
const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Component.displayName = "Component";

export { Component, componentVariants };
```

---

## Strict Rules

### 1. Accessibility (A11y) - Non-Negotiable

```tsx
// ALWAYS use Radix primitives for interactive elements
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tabs from "@radix-ui/react-tabs";
import * as Accordion from "@radix-ui/react-accordion";

// NEVER build custom dropdowns, modals, tabs from scratch
// Radix handles: focus management, keyboard nav, screen readers, ARIA
```

**Required for all interactive elements:**
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus indicators (visible, high contrast)
- ARIA labels on icons and non-text elements
- Role attributes where semantic HTML isn't sufficient
- Reduced motion support: `motion-reduce:transition-none`

### 2. State Handling - Use Radix Data Attributes

Radix provides `data-state` attributes automatically. Use them:

```tsx
// Radix exposes states via data attributes
<AccordionTrigger className="
  data-[state=open]:bg-muted
  data-[state=closed]:bg-background
" />

<DialogOverlay className="
  data-[state=open]:animate-in
  data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0
  data-[state=open]:fade-in-0
" />

// Hover, focus, active, disabled - all built into Tailwind
<Button className="
  hover:bg-primary/90
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  active:scale-[0.98]
  disabled:pointer-events-none disabled:opacity-50
" />
```

### 3. Styling Standards

**DO:**
```tsx
// Use design tokens from Tailwind config
className="bg-background text-foreground border-border"

// Use semantic color names
className="bg-primary text-primary-foreground"
className="bg-destructive text-destructive-foreground"
className="bg-muted text-muted-foreground"

// Responsive mobile-first
className="px-4 md:px-6 lg:px-8"

// Dark mode via class strategy
className="bg-white dark:bg-slate-900"
```

**DON'T:**
```tsx
// Never hardcode colors
className="bg-[#3b82f6]" // BAD
className="bg-blue-500"   // OK but prefer semantic

// Never use inline styles
style={{ marginTop: 20 }} // BAD

// Never mix styling approaches
<div className="p-4" style={{ color: 'red' }}> // BAD
```

### 4. Performance Requirements

```tsx
// Lazy load below-fold components
const HeavyChart = dynamic(() => import("./heavy-chart"), {
  loading: () => <Skeleton className="h-[300px]" />,
  ssr: false,
});

// Memoize expensive renders
const MemoizedList = memo(function List({ items }: Props) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// Use CSS for animations, not JS
className="transition-all duration-200 ease-out"

// Images: always use next/image
import Image from "next/image";
<Image
  src={src}
  alt={alt} // REQUIRED - never empty
  width={400}
  height={300}
  className="object-cover"
  priority={isAboveFold}
/>
```

### 5. Type Safety

```tsx
// All props must be typed - no `any`
interface Props {
  variant: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onAction: (id: string) => void;
}

// Use satisfies for type checking with inference
const config = {
  theme: "dark",
  features: ["a", "b"],
} satisfies Config;

// Zod for runtime validation
const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be 8+ characters"),
});
```

### 6. Error & Loading States

Every async component MUST handle all states:

```tsx
function AsyncComponent() {
  const { data, error, isLoading } = useQuery();

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message="No items found" />;
  }

  return <DataDisplay data={data} />;
}
```

### 7. Form Handling

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(3, "Enter at least 3 characters"),
});

function SearchForm({ onSubmit }: Props) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { query: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search</FormLabel>
              <FormControl>
                <Input placeholder="Ask anything..." {...field} />
              </FormControl>
              <FormMessage /> {/* Auto-displays validation errors */}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Animation Standards

```tsx
// Entry animations with Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>

// Respect reduced motion
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: prefersReducedMotion ? 0 : 0.2
  }}
>

// Staggered children
<motion.ul>
  {items.map((item, i) => (
    <motion.li
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
    />
  ))}
</motion.ul>
```

---

## Code Review Checklist

Before submitting any frontend code, verify:

- [ ] Uses shadcn/ui or Radix primitives for interactive elements
- [ ] All states handled (loading, error, empty, success)
- [ ] Keyboard accessible (Tab, Enter, Escape work)
- [ ] Focus indicators visible
- [ ] No hardcoded colors - uses design tokens
- [ ] Mobile responsive (test at 320px, 768px, 1024px)
- [ ] Dark mode works
- [ ] Images have alt text
- [ ] No TypeScript `any` types
- [ ] No inline styles
- [ ] Animations respect reduced motion
- [ ] Forms validated with Zod
- [ ] Error messages are user-friendly

---

## Quick Reference: shadcn/ui Components

Use these instead of building from scratch:

| Need | Use |
|------|-----|
| Button | `<Button variant="default\|destructive\|outline\|ghost\|link">` |
| Input | `<Input type="text\|email\|password">` |
| Select | `<Select><SelectTrigger><SelectContent>` |
| Modal | `<Dialog><DialogTrigger><DialogContent>` |
| Dropdown | `<DropdownMenu><DropdownMenuTrigger><DropdownMenuContent>` |
| Tabs | `<Tabs><TabsList><TabsTrigger><TabsContent>` |
| Accordion | `<Accordion><AccordionItem><AccordionTrigger><AccordionContent>` |
| Toast | `toast({ title, description, variant })` |
| Card | `<Card><CardHeader><CardContent><CardFooter>` |
| Alert | `<Alert variant="default\|destructive">` |
| Skeleton | `<Skeleton className="h-4 w-full">` |
| Badge | `<Badge variant="default\|secondary\|outline\|destructive">` |
| Avatar | `<Avatar><AvatarImage><AvatarFallback>` |
| Tooltip | `<Tooltip><TooltipTrigger><TooltipContent>` |
| Sheet | `<Sheet><SheetTrigger><SheetContent>` (mobile drawer) |
| Command | `<Command>` (search/command palette) |

---

## Common Patterns

### Conditional Rendering
```tsx
// Prefer early returns
if (!data) return null;

// Use && for simple conditionals
{isVisible && <Component />}

// Use ternary for either/or
{isLoading ? <Skeleton /> : <Content />}
```

### Event Handlers
```tsx
// Inline for simple handlers
<Button onClick={() => setOpen(true)}>

// Extract for complex logic
const handleSubmit = useCallback(async (data: FormData) => {
  try {
    await submitForm(data);
    toast({ title: "Success" });
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  }
}, []);
```

### Server vs Client Components
```tsx
// Default: Server Component (no directive needed)
// Can: fetch data, access backend, use async/await
// Cannot: useState, useEffect, onClick, browser APIs

// Add "use client" only when needed:
// - useState, useEffect, useContext
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)
// - Third-party client libraries
```

---

**Remember: Every component you write will be used by real users. Accessibility, performance, and UX are not optional.**
