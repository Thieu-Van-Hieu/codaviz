import { useCallback, useEffect, useRef, useState } from "react";
import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useDiagramStore } from "../../store/diagramStore";
import type { ParseError } from "../../types/diagram";

/** Font size range for editor zoom */
const FONT_MIN = 6;
const FONT_MAX = 24;
const FONT_DEFAULT = 10;

/**
 * Converts ParseError list into Monaco marker data for inline highlighting.
 * Each error appears as a red squiggle on the relevant line.
 */
const toMarkers = (errors: ParseError[], monaco: typeof Monaco): Monaco.editor.IMarkerData[] =>
    errors.map((e) => ({
        severity: monaco.MarkerSeverity.Error,
        message: `[${e.code}] ${e.message}`,
        startLineNumber: e.line ?? 1,
        startColumn: e.column ?? 1,
        endLineNumber: e.line ?? 1,
        endColumn: e.column ? e.column + (e.token?.length ?? 10) : 200,
    }));

/**
 * Monaco-based code editor for CodaViz DSL.
 *
 * Features:
 * - Mermaid-like syntax highlighting
 * - Inline error markers synced from the parse pipeline
 * - Ctrl + / Ctrl - to zoom font size
 * - Two-way sync: editor → store (on change), store → editor (after drag)
 */
export const Editor = () => {
    const source = useDiagramStore((s) => s.source);
    const setSource = useDiagramStore((s) => s.setSource);
    const errors = useDiagramStore((s) => s.errors);
    const isSyncing = useDiagramStore((s) => s.isSyncing);

    const [fontSize, setFontSize] = useState(FONT_DEFAULT);

    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);

    // ── Mount: register language + keybindings ───────────────────────────────
    const onMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        /** Register a minimal Mermaid tokeniser for syntax colouring */
        monaco.languages.register({ id: "mermaid" });
        monaco.languages.setMonarchTokensProvider("mermaid", {
            tokenizer: {
                root: [
                    [/^---$/m, "keyword.control"],
                    [/^graph\s+(TD|LR|BT|RL)/m, "keyword"],
                    [/\[([^\]]*)\]/, "string"],
                    [/-->|---|-\.->|--o|--x/, "operator"],
                    [/\|[^|]*\|/, "comment"],
                    [/%%.*$/, "comment"],
                    [/^(metadata|nodes|settings):/m, "type"],
                    [/#[0-9a-fA-F]{3,6}/, "number.hex"],
                    [/[A-Za-z0-9_]+/, "identifier"],
                ],
            },
        });
        monaco.editor.setModelLanguage(editor.getModel()!, "mermaid");

        /** Ctrl/Cmd + = / + → zoom in */
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () =>
            setFontSize((s) => Math.min(FONT_MAX, s + 1)),
        );
        /** Ctrl/Cmd + - → zoom out */
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () =>
            setFontSize((s) => Math.max(FONT_MIN, s - 1)),
        );
        /** Ctrl/Cmd + 0 → reset zoom */
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => setFontSize(FONT_DEFAULT));
    }, []);

    // ── Sync font size change into live editor ────────────────────────────────
    useEffect(() => {
        editorRef.current?.updateOptions({ fontSize });
    }, [fontSize]);

    // ── Sync store → editor when drag writes back (isSyncing) ────────────────
    useEffect(() => {
        if (!isSyncing) return;
        const editor = editorRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;

        // Preserve cursor so the editor doesn't jump to top
        const position = editor.getPosition();
        model.pushEditOperations([], [{ range: model.getFullModelRange(), text: source }], () => null);
        if (position) editor.setPosition(position);
    }, [source, isSyncing]);

    // ── Update inline error markers whenever errors change ───────────────────
    useEffect(() => {
        const monaco = monacoRef.current;
        const model = editorRef.current?.getModel();
        if (!monaco || !model) return;
        monaco.editor.setModelMarkers(model, "codaviz", toMarkers(errors, monaco));
    }, [errors]);

    /** Forward editor changes to the global store (triggers parse pipeline) */
    const onChange = useCallback(
        (val: string | undefined) => {
            setSource(val ?? "");
        },
        [setSource],
    );

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Zoom hint bar */}
            <div
                style={{
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: "0 10px",
                    background: "#f7f6f2",
                    borderBottom: "0.5px solid #e5e4dc",
                    gap: 8,
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={() => setFontSize((s) => Math.max(FONT_MIN, s - 1))}
                    title="Thu nhỏ (Ctrl -)"
                    style={zoomBtnStyle}
                >
                    A−
                </button>
                <span style={{ fontSize: 10, color: "#b4b2a9", minWidth: 28, textAlign: "center" }}>{fontSize}px</span>
                <button
                    onClick={() => setFontSize((s) => Math.min(FONT_MAX, s + 1))}
                    title="Phóng to (Ctrl +)"
                    style={zoomBtnStyle}
                >
                    A+
                </button>
                <button
                    onClick={() => setFontSize(FONT_DEFAULT)}
                    title="Reset (Ctrl 0)"
                    style={{ ...zoomBtnStyle, color: "#b4b2a9" }}
                >
                    ↺
                </button>
            </div>

            {/* Monaco editor */}
            <div style={{ flex: 1, overflow: "hidden" }}>
                <MonacoEditor
                    height="100%"
                    language="mermaid"
                    value={source}
                    onChange={onChange}
                    onMount={onMount}
                    options={{
                        fontSize,
                        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                        lineHeight: 22,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "off",
                        renderLineHighlight: "gutter",
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        padding: { top: 12, bottom: 12 },
                        tabSize: 2,
                        insertSpaces: true,
                    }}
                />
            </div>
        </div>
    );
};

const zoomBtnStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: "#7F77DD",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "1px 4px",
    borderRadius: 3,
    fontFamily: "monospace",
};