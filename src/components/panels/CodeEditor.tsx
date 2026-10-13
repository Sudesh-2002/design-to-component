"use client";

import { useEffect, useRef } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";

export type CodeEditorInstance = Parameters<OnMount>[0];

interface CodeEditorProps {
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  onReady?: (editor: CodeEditorInstance) => void;
}

const beforeMount: BeforeMount = (monaco) => {
  const ts = monaco.languages.typescript;

  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    jsx: ts.JsxEmit.Preserve,
    allowNonTsExtensions: true,
    esModuleInterop: true,
  });

  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  monaco.editor.defineTheme("playground", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: { "editor.background": "#0a0a0a" }, 
  });
};

export function CodeEditor({
  value,
  readOnly,
  onChange,
  onReady,
}: CodeEditorProps) {
  const editorRef = useRef<CodeEditorInstance | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });

    onReady?.(editor);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!readOnly || !editor) return;
    const lines = editor.getModel()?.getLineCount();
    if (lines) editor.revealLine(lines);
  }, [value, readOnly]);

  return (
    <Editor
      height="100%"
      path="file:///component.tsx"
      language="typescript"
      theme="playground"
      value={value}
      beforeMount={beforeMount}
      onMount={handleMount}
      onChange={(next) => {
        if (!readOnly) onChange(next ?? "");
      }}
      loading={<p className="text-sm text-neutral-500">Loading editor…</p>}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 20,
        tabSize: 2,
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: readOnly ? "none" : "line",
        fixedOverflowWidgets: true,
      }}
    />
  );
}