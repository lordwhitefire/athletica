"use client";

import { useState, useEffect, useRef } from "react";
import type { ApiResult } from "@/lib/api-types";

interface AutoSuggestProps {
  value: string;
  onChange: (value: string) => void;
  fetchSuggestions: (query: string) => Promise<ApiResult<string[]>>;
  label: string;
  placeholder?: string;
  name?: string;
  hideLabel?: boolean;
  className?: string;
}

export default function AutoSuggest({ value, onChange, fetchSuggestions, label, placeholder, name, hideLabel, className }: AutoSuggestProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(newValue: string) {
    setInputValue(newValue);
    onChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!newValue.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchSuggestions(newValue);
        setSuggestions(result.data ?? []);
        setShowDropdown((result.data ?? []).length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function selectSuggestion(suggestion: string) {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={wrapperRef} className={className || "relative"}>
      {!hideLabel && <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">{label}</label>}
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors"
      />
      {loading && (
        <div className="absolute right-3 top-8">
          <span className="material-symbols-outlined text-zinc-500 text-[14px] animate-spin">refresh</span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((suggestion, i) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                i === selectedIndex ? "bg-primary text-on-primary" : "text-zinc-300 hover:bg-neutral-700"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
