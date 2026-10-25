/**
 * SettingsStore - Persists extension settings using Chrome Storage API.
 */

import type { ExtensionSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'chess-training-assistant-settings';

export class SettingsStore {
  private settings: ExtensionSettings;
  private listeners: Set<(settings: ExtensionSettings) => void> = new Set();

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  /**
   * Load settings from storage.
   */
  async load(): Promise<ExtensionSettings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
          this.settings = this.mergeWithDefaults(result[STORAGE_KEY]);
        }
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.settings = this.mergeWithDefaults(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to load settings:', error);
    }

    return this.settings;
  }

  /**
   * Save settings to storage.
   */
  async save(settings?: Partial<ExtensionSettings>): Promise<void> {
    if (settings) {
      this.settings = this.mergeWithDefaults({ ...this.settings, ...settings });
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set({ [STORAGE_KEY]: this.settings });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to save settings:', error);
    }

    this.notifyListeners();
  }

  /**
   * Update a specific section of settings.
   */
  async updateSection<K extends keyof ExtensionSettings>(
    section: K,
    values: Partial<ExtensionSettings[K]>
  ): Promise<void> {
    this.settings[section] = { ...this.settings[section], ...values };
    await this.save();
  }

  /**
   * Get current settings.
   */
  get(): ExtensionSettings {
    return { ...this.settings };
  }

  /**
   * Get a specific section.
   */
  getSection<K extends keyof ExtensionSettings>(section: K): ExtensionSettings[K] {
    return { ...this.settings[section] };
  }

  /**
   * Reset to defaults.
   */
  async reset(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.save();
  }

  /**
   * Subscribe to settings changes.
   */
  subscribe(listener: (settings: ExtensionSettings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.settings);
    }
  }

  /**
   * Merge stored settings with defaults to handle new fields.
   */
  private mergeWithDefaults(stored: any): ExtensionSettings {
    const merged = { ...DEFAULT_SETTINGS };

    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof ExtensionSettings)[]) {
      if (stored[key] !== undefined) {
        if (typeof merged[key] === 'object' && merged[key] !== null) {
          (merged as any)[key] = { ...(merged[key] as any), ...(stored[key] as any) };
        } else {
          (merged as any)[key] = stored[key];
        }
      }
    }

    return merged;
  }
}
