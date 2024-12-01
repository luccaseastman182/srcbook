import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import useTheme from '@srcbook/components/src/components/use-theme';
import { extname } from './lib/path';
import { EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { unifiedMergeView } from '@codemirror/merge';
import { useEffect, useRef } from 'react';

export function CodeEditor({
  path,
  source,
  onChange,
}: {
  path: string;
  source: string;
  onChange: (updatedSource: string) => void;
}) {
  const { codeTheme } = useTheme();
  const editorRef = useRef(null);

  const languageExtension = getCodeMirrorLanguageExtension(path);
  const extensions = languageExtension ? [languageExtension] : [];

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.editor.focus();
    }
  }, [path]);

  return (
    <CodeMirror
      key={path}
      value={source}
      theme={codeTheme}
      extensions={extensions}
      onChange={onChange}
      ref={editorRef}
      aria-label="Code editor"
    />
  );
}

export function DiffEditor({
  path,
  modified,
  original,
  collapseUnchanged,
}: {
  path: string;
  modified: string;
  original: string | null;
  collapseUnchanged?: {
    minSize: number;
    margin: number;
  };
}) {
  const { codeTheme } = useTheme();
  const editorRef = useRef(null);

  const extensions = [
    EditorView.editable.of(false),
    EditorState.readOnly.of(true),
    unifiedMergeView({
      original: original ?? '',
      mergeControls: false,
      highlightChanges: false,
      collapseUnchanged: collapseUnchanged,
    }),
  ];

  const languageExtension = getCodeMirrorLanguageExtension(path);

  if (languageExtension) {
    extensions.unshift(languageExtension);
  }

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.editor.focus();
    }
  }, [path]);

  return (
    <CodeMirror
      value={modified}
      theme={codeTheme}
      extensions={extensions}
      ref={editorRef}
      aria-label="Diff editor"
    />
  );
}

function getCodeMirrorLanguageExtension(path: string) {
  switch (extname(path)) {
    case '.json':
      return json();
    case '.css':
      return css();
    case '.html':
      return html();
    case '.md':
    case '.markdown':
      return markdown();
    case '.js':
    case '.cjs':
    case '.mjs':
    case '.jsx':
    case '.ts':
    case '.cts':
    case '.mts':
    case '.tsx':
      return javascript({ typescript: true, jsx: true });
  }
}
