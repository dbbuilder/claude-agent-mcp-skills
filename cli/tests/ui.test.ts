/**
 * Tests for CLI UI utilities
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UI } from '../src/ui.js';

describe('UI', () => {
  let ui: UI;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    ui = new UI();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Message methods', () => {
    it('should output success messages', () => {
      ui.success('Test success');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Test success');
    });

    it('should output error messages', () => {
      ui.error('Test error');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Test error');
    });

    it('should output warning messages', () => {
      ui.warning('Test warning');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Test warning');
    });

    it('should output info messages', () => {
      ui.info('Test info');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Test info');
    });
  });

  describe('Formatting methods', () => {
    it('should output blank lines', () => {
      ui.blank();
      expect(consoleSpy).toHaveBeenCalledWith('');
    });

    it('should output headers', () => {
      ui.header('Test Header');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Test Header');
    });

    it('should output headers with styling', () => {
      ui.header('Test Header 2');
      expect(consoleSpy).toHaveBeenCalled();
      // Header includes newline formatting
      expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data display methods', () => {
    it('should output key-value pairs', () => {
      ui.keyValue('Key', 'Value');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Key');
      expect(output).toContain('Value');
    });

    it('should output list items', () => {
      ui.listItem('Item 1');
      ui.listItem('Item 2');
      ui.listItem('Item 3');
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should output tables', () => {
      const headers = ['Name', 'Value'];
      const rows = [
        ['Row1', 'Val1'],
        ['Row2', 'Val2'],
      ];

      ui.table(headers, rows);

      // Should output header and 2 rows
      expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Banner', () => {
    it('should output ASCII art banner', () => {
      ui.banner();
      expect(consoleSpy).toHaveBeenCalled();
      // Banner should include multiple lines of ASCII art
      expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
