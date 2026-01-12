/**
 * React Testing Library Utilities
 *
 * Custom render function and testing helpers for React components.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock user context
interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

const defaultMockUser: MockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

// Mock Supabase auth context
const MockAuthContext = React.createContext<{
  user: MockUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}>({
  user: defaultMockUser,
  isLoading: false,
  signOut: async () => {},
});

// Auth provider for testing
interface AuthProviderProps {
  children: React.ReactNode;
  user?: MockUser | null;
  isLoading?: boolean;
}

function MockAuthProvider({ children, user = defaultMockUser, isLoading = false }: AuthProviderProps) {
  return (
    <MockAuthContext.Provider value={{ user, isLoading, signOut: async () => {} }}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: MockUser | null;
  isLoading?: boolean;
  route?: string;
}

// All providers wrapper
function AllProviders({
  children,
  user = defaultMockUser,
  isLoading = false,
}: {
  children: React.ReactNode;
  user?: MockUser | null;
  isLoading?: boolean;
}) {
  return (
    <MockAuthProvider user={user} isLoading={isLoading}>
      {children}
    </MockAuthProvider>
  );
}

// Custom render function
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { user: mockUser, isLoading, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders user={mockUser} isLoading={isLoading}>
      {children}
    </AllProviders>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Helper to wait for async updates
export async function waitForLoadingToFinish() {
  // Wait for any pending state updates
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Helper to create mock brief data
export function createMockBrief(overrides: Partial<{
  id: string;
  question: string;
  narrative: string;
  summaries: any;
  structured_data: any;
  clarity_score: number;
  clarity_critique: any;
  user_id: string;
  created_at: string;
}> = {}) {
  return {
    id: 'test-brief-id',
    question: 'What is the test question?',
    narrative: 'This is the test narrative.',
    summaries: {
      child: 'Simple summary',
      teen: 'Teen summary',
      undergrad: 'Undergrad summary',
      postdoc: 'Postdoc summary',
    },
    structured_data: {
      definitions: [{ term: 'Test', definition: 'A test definition' }],
      factors: [{ name: 'Factor 1', description: 'Test factor' }],
      policies: [{ name: 'Policy 1', description: 'Test policy' }],
    },
    clarity_score: 8.0,
    clarity_critique: {
      overall_score: 8.0,
      dimensions: {
        first_principles_coherence: { score: 8.0, critique: 'Good' },
        internal_consistency: { score: 8.5, critique: 'Good' },
        evidence_quality: { score: 7.5, critique: 'Acceptable' },
        accessibility: { score: 8.0, critique: 'Good' },
        objectivity: { score: 7.0, critique: 'Acceptable' },
        factual_accuracy: { score: 8.5, critique: 'Good' },
        bias_detection: { score: 7.5, critique: 'Acceptable' },
      },
    },
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock source data
export function createMockSource(overrides: Partial<{
  id: string;
  url: string;
  title: string;
  publisher: string;
  political_lean: string;
  credibility_score: number;
}> = {}) {
  return {
    id: 'test-source-id',
    url: 'https://example.com/article',
    title: 'Test Article',
    publisher: 'Test Publisher',
    political_lean: 'center',
    credibility_score: 0.85,
    ...overrides,
  };
}

// Helper to create mock user data
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    ...defaultMockUser,
    ...overrides,
  };
}

// Helper to simulate API error responses
export function createApiError(status: number, message: string) {
  const error = new Error(message);
  (error as any).status = status;
  return error;
}

// Helper to mock fetch responses
export function mockFetchResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
}

// Helper to mock fetch errors
export function mockFetchError(message: string) {
  return Promise.reject(new Error(message));
}
