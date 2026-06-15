"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { splitModel, joinModel } from "@/lib/model";
import type { ModelNavNode } from "@/lib/getNavigation";

interface ModelInputProps {
    modelNavTree: ModelNavNode[];
    value: string;
    onChange: (value: string) => void;
    onValidChange?: (valid: boolean) => void;
}

interface Suggestion {
    label: string;
    type: "C" | "T";
    node?: ModelNavNode;
}

export default function ModelInput({ modelNavTree, value, onChange, onValidChange }: ModelInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const segments = useMemo(() => {
        if (!value) return [];
        return splitModel(value).filter((s) => s.trim().length > 0);
    }, [value]);

    const isComplete = useMemo(() => {
        if (segments.length === 0) return false;
        const last = segments[segments.length - 1];
        // Check if last segment looks like a type (contains hyphen or can't be found in nav as classification)
        const isType = !!last && !findNodeAtDepth(last, segments.length - 1)?.children?.length;
        return !!last && isType;
    }, [segments]);

    function findNodeAtDepth(label: string, depth: number): ModelNavNode | undefined {
        if (depth === 0) {
            return modelNavTree.find((n) => n.label.toLowerCase() === label.toLowerCase());
        }
        let candidates = modelNavTree;
        for (let i = 0; i < depth; i++) {
            const seg = segments[i];
            if (!seg) return undefined;
            const match = candidates.find((n) => n.label.toLowerCase() === seg.toLowerCase());
            if (!match) return undefined;
            candidates = match.children;
        }
        return candidates.find((n) => n.label.toLowerCase() === label.toLowerCase());
    }

    function getTypeLabel(segment: string, index: number): "C" | "T" {
        const node = findNodeAtDepth(segment, index);
        if (!node || node.children.length === 0) return "T";
        return "C";
    }

    const suggestions = useMemo((): Suggestion[] => {
        if (!inputValue.trim()) return [];
        const q = inputValue.trim().toLowerCase();

        const results: Suggestion[] = [];

        // Find candidates at the current depth
        let candidates = modelNavTree;
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const match = candidates.find((n) => n.label.toLowerCase() === seg.toLowerCase());
            if (!match) break;
            candidates = match.children;
        }

        // Suggest matching items from nav tree at current depth
        for (const node of candidates) {
            if (node.label.toLowerCase().startsWith(q)) {
                results.push({
                    label: node.label,
                    type: node.children.length > 0 ? "C" : "T",
                    node,
                });
            }
        }

        // If the typed text itself isn't already in results, add [C] and [T] variants
        const exactMatch = results.find((r) => r.label.toLowerCase() === q);
        if (!exactMatch) {
            results.push({ label: inputValue.trim(), type: "C" });
            results.push({ label: inputValue.trim(), type: "T" });
        }

        return results.slice(0, 10);
    }, [inputValue, segments, modelNavTree]);

    const valid = useMemo(() => {
        if (segments.length === 0) return false;
        const last = segments[segments.length - 1];
        return !!last && getTypeLabel(last, segments.length - 1) === "T";
    }, [segments]);

    useEffect(() => {
        onValidChange?.(valid);
    }, [valid, onValidChange]);

    function selectSuggestion(suggestion: Suggestion) {
        setInputValue("");
        setShowDropdown(false);
        setError(null);

        const newSegments = [...segments, suggestion.label];
        onChange(joinModel(newSegments) + (suggestion.type === "T" ? "" : "/"));
    }

    function removeSegment(index: number) {
        const newSegments = segments.filter((_, i) => i !== index);
        onChange(newSegments.length > 0 ? joinModel(newSegments) + "/" : "");
        setError(null);
        inputRef.current?.focus();
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setInputValue(e.target.value);
        setShowDropdown(true);
        setError(null);
    }

    function handleInputKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions.length > 0) {
                selectSuggestion(suggestions[0]);
            }
        }
        if (e.key === "Backspace" && inputValue === "" && segments.length > 0) {
            removeSegment(segments.length - 1);
        }
        if (e.key === "Escape") {
            setShowDropdown(false);
        }
    }

    function handleBlur() {
        setTimeout(() => setShowDropdown(false), 200);

        if (segments.length > 0) {
            const last = segments[segments.length - 1];
            const lastType = getTypeLabel(last, segments.length - 1);
            if (lastType === "C") {
                setError("Model must end with a product type. Add a type or change the last segment.");
            } else {
                setError(null);
            }
        } else {
            setError(null);
        }
    }

    return (
        <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1 uppercase tracking-wider">
                Model
            </label>
            <div
                className={`flex flex-wrap gap-1.5 px-3 py-2 bg-neutral-800 border rounded text-sm transition-colors cursor-text ${error ? "border-red-500" : "border-neutral-700 focus-within:border-primary"
                    }`}
                onClick={() => inputRef.current?.focus()}
            >
                {segments.map((seg, idx) => (
                    <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getTypeLabel(seg, idx) === "C"
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-amber-900/50 text-amber-300"
                            }`}
                    >
                        <span className="opacity-70 text-[10px] uppercase">
                            {getTypeLabel(seg, idx) === "C" ? "C" : "T"}
                        </span>
                        {seg}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeSegment(idx); }}
                            className="ml-0.5 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    </span>
                ))}
                {!isComplete && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={handleBlur}
                        placeholder={segments.length === 0 ? "Type model segment..." : ""}
                        className="flex-1 min-w-[120px] bg-transparent text-white outline-none text-sm"
                    />
                )}
            </div>

            {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
            )}

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="relative"
                >
                    <div className="absolute z-50 top-1 left-0 right-0 bg-neutral-800 border border-neutral-700 rounded shadow-xl max-h-48 overflow-y-auto">
                        {suggestions.map((s, idx) => (
                            <button
                                key={`${s.label}-${s.type}-${idx}`}
                                type="button"
                                onMouseDown={() => selectSuggestion(s)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-700 transition-colors text-sm"
                            >
                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.type === "C"
                                        ? "bg-blue-900/50 text-blue-300"
                                        : "bg-amber-900/50 text-amber-300"
                                    }`}>
                                    {s.type}
                                </span>
                                <span className="text-white">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
