export function splitModel(model: string): string[] {
    const segments: string[] = [];
    let current = "";
    let depth = 0;
    for (const char of model) {
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (char === "/" && depth === 0) {
            segments.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    segments.push(current);
    return segments;
}

export function joinModel(segments: string[]): string {
    return segments
        .map(s => s.includes("/") ? `(${s})` : s)
        .join("/");
}
