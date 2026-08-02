// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../App';

describe('CommandPalette Component & Global Hotkeys (SPEC 006)', () => {
  beforeEach(() => {
    // Mock window.matchMedia for jsdom environment
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock global fetch for health check API call in App.tsx
    window.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      })
    ) as any;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Cmd+K / Ctrl+K Keydown Triggering', () => {
    it('does not render command palette modal by default', () => {
      render(<App />);
      expect(screen.queryByTestId('command-palette-modal')).toBeNull();
    });

    it('opens command palette overlay when Cmd+K key combination is pressed', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(screen.getByTestId('command-palette-modal')).toBeTruthy();
    });

    it('opens command palette overlay when Ctrl+K key combination is pressed', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      expect(screen.getByTestId('command-palette-modal')).toBeTruthy();
    });

    it('closes command palette overlay when Escape key is pressed', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(screen.getByTestId('command-palette-modal')).toBeTruthy();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('command-palette-modal')).toBeNull();
    });
  });

  describe('Command Palette Structure & Inputs', () => {
    it('renders palette search input with data-testid="command-palette-input"', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      const searchInput = screen.getByTestId('command-palette-input');
      expect(searchInput).toBeTruthy();
    });

    it('renders quick actions list container with data-testid="command-palette-actions"', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      const actionsContainer = screen.getByTestId('command-palette-actions');
      expect(actionsContainer).toBeTruthy();
    });

    it('renders required quick actions: Filter Critical, Reset Filters, Toggle Theme, Load Demo', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      const actionsContainer = screen.getByTestId('command-palette-actions');
      expect(actionsContainer.textContent).toMatch(/Filter Critical/i);
      expect(actionsContainer.textContent).toMatch(/Reset All Queue Filters|Reset Filters/i);
      expect(actionsContainer.textContent).toMatch(/Toggle Dark \/ Light Theme|Toggle Theme/i);
      expect(actionsContainer.textContent).toMatch(/Load 250 Demo Tickets|Load Demo/i);
    });
  });

  describe('Command Execution & Navigation', () => {
    it('filters quick actions list based on user search input', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      const searchInput = screen.getByTestId('command-palette-input') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Theme' } });

      const actionsContainer = screen.getByTestId('command-palette-actions');
      expect(actionsContainer.textContent).toMatch(/Theme/i);
      expect(actionsContainer.textContent).not.toMatch(/Load 250 Demo Tickets/i);
    });

    it('executes Filter Critical Tickets action when selected', () => {
      render(<App />);
      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      const criticalBtn = screen.getByText(/Filter Critical/i);
      fireEvent.click(criticalBtn);

      // Modal should close upon action execution
      expect(screen.queryByTestId('command-palette-modal')).toBeNull();
    });

    it('executes Toggle Theme action when clicked', () => {
      render(<App />);
      const initialTheme = document.documentElement.getAttribute('data-theme');

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      const themeBtn = screen.getByText(/Toggle Dark \/ Light Theme|Toggle Theme/i);
      fireEvent.click(themeBtn);

      const newTheme = document.documentElement.getAttribute('data-theme');
      expect(newTheme).not.toBe(initialTheme);
    });
  });
});
