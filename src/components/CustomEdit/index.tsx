import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import "./monaco-config";

interface CustomEditProps {
  className?: string;
  original: string;
  modified?: string;
  readOnly?: boolean;
  height?: number | string;
  language?: string;
  scrollEnd?: boolean;
  diff?: boolean;
  wordWrap?: boolean;
  renderSideBySide?: boolean;
  onReset?: () => void;
}

export interface CustomEditRef {
  reset: () => void;
  getContent: () => string;
}

const CustomEdit = forwardRef<CustomEditRef, CustomEditProps>(
  (
    {
      className,
      original,
      readOnly = true,
      height,
      language = "yaml",
      scrollEnd = false,
      modified,
      diff = false,
      renderSideBySide = false,
      wordWrap = false,
      onReset,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<
      | monaco.editor.IStandaloneCodeEditor
      | monaco.editor.IStandaloneDiffEditor
      | null
    >(null);
    const lastScrollPosition = useRef<number>(0);
    const currentEditorContent = useRef<string>(original);
    const userEditedContent = useRef<string>(original);

    useImperativeHandle(ref, () => ({
      reset: resetEditorData,
      getContent: getContent,
    }));

    // 获取当前编辑器内容
    const getCurrentEditorContent = (): string => {
      if (editorRef.current && "getValue" in editorRef.current) {
        const editor = editorRef.current as monaco.editor.IStandaloneCodeEditor;
        return editor.getValue();
      }
      return userEditedContent.current;
    };

    // 获取当前内容并触发回调
    const getContent = (): string => {
      return getCurrentEditorContent();
    };

    // 获取modified内容，如果未传入则使用当前编辑器内容
    const getModifiedContent = (): string => {
      if (modified !== undefined) {
        return modified;
      }
      return getCurrentEditorContent();
    };

    // 重置编辑器数据
    const resetEditorData = () => {
      currentEditorContent.current = original;
      userEditedContent.current = original;

      // 如果编辑器存在，重置其内容
      if (editorRef.current) {
        if (diff && "setModel" in editorRef.current) {
          const diffEditor =
            editorRef.current as monaco.editor.IStandaloneDiffEditor;
          diffEditor.setModel({
            original: monaco.editor.createModel(original, language),
            modified: monaco.editor.createModel(original, language),
          });
        } else if (!diff && "setValue" in editorRef.current) {
          const editor =
            editorRef.current as monaco.editor.IStandaloneCodeEditor;
          editor.setValue(original);
        }
      }

      // 调用外部重置回调
      onReset?.();
    };

    // 创建编辑器的通用配置
    const getEditorOptions =
      (): monaco.editor.IStandaloneEditorConstructionOptions => ({
        theme: "vs-dark",
        renderLineHighlight: "gutter",
        folding: true,
        roundedSelection: false,
        foldingHighlight: true,
        foldingStrategy: "indentation",
        showFoldingControls: "always",
        disableLayerHinting: true,
        emptySelectionClipboard: false,
        selectionClipboard: false,
        automaticLayout: true,
        codeLens: true,
        scrollBeyondLastLine: false,
        colorDecorators: true,
        accessibilitySupport: "on",
        lineNumbers: "on",
        lineNumbersMinChars: 5,
        wordWrap: !wordWrap ? "off" : "on",
        readOnly,
      });

    // 创建diff编辑器的配置
    const getDiffEditorOptions =
      (): monaco.editor.IDiffEditorConstructionOptions => ({
        ...getEditorOptions(),
        modifiedAriaLabel: "Modified",
        originalAriaLabel: "Original",
        enableSplitViewResizing: false,
        renderSideBySide: renderSideBySide,
      });

    const createEditor = () => {
      if (!containerRef.current) return;

      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }

      if (diff) {
        const diffEditor = monaco.editor.createDiffEditor(
          containerRef.current,
          getDiffEditorOptions()
        );
        const originalModel = monaco.editor.createModel(original, language);
        const modifiedModel = monaco.editor.createModel(
          getModifiedContent(),
          language
        );

        diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel,
        });

        modifiedModel.onDidChangeContent(() => {
          const newContent = modifiedModel.getValue();
          userEditedContent.current = newContent;
          currentEditorContent.current = newContent;
        });

        editorRef.current = diffEditor;
      } else {
        const editor = monaco.editor.create(containerRef.current, {
          ...getEditorOptions(),
          value: userEditedContent.current,
          language,
        });
        editorRef.current = editor;

        editor.onDidChangeModelContent(() => {
          const newContent = editor.getValue();
          userEditedContent.current = newContent;
          currentEditorContent.current = newContent;
        });
      }
    };

    const updateEditorContent = () => {
      if (!editorRef.current) return;

      if (diff && "setModel" in editorRef.current) {
        const diffEditor =
          editorRef.current as monaco.editor.IStandaloneDiffEditor;
        const originalModel = monaco.editor.createModel(original, language);
        const modifiedModel = monaco.editor.createModel(
          getModifiedContent(),
          language
        );

        diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel,
        });

        modifiedModel.onDidChangeContent(() => {
          const newContent = modifiedModel.getValue();
          userEditedContent.current = newContent;
          currentEditorContent.current = newContent;
        });
      } else if (!diff && "setValue" in editorRef.current) {
        const editor = editorRef.current as monaco.editor.IStandaloneCodeEditor;

        // 只有当original内容真正变化时，才更新编辑器内容
        // 这样可以避免在模式切换时覆盖用户的编辑内容
        if (original !== currentEditorContent.current) {
          // 保存滚动位置
          lastScrollPosition.current = editor.getScrollTop();

          // 更新编辑器内容和用户编辑内容
          editor.setValue(original);
          userEditedContent.current = original;
          currentEditorContent.current = original;

          // 恢复滚动位置或滚动到底部
          if (scrollEnd) {
            editor.setScrollTop(editor.getScrollHeight());
          } else {
            editor.setScrollTop(lastScrollPosition.current);
          }
        }
      }
    };

    // init editor
    useEffect(() => {
      createEditor();

      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
    }, [diff, language, readOnly, renderSideBySide]);

    //  update editor content
    useEffect(() => {
      updateEditorContent();
    }, [original, modified, language]);

    useEffect(() => {
      currentEditorContent.current = original;
      if (userEditedContent.current === currentEditorContent.current) {
        userEditedContent.current = original;
      }
    }, [original]);

    useEffect(() => {
      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
        currentEditorContent.current = "";
        userEditedContent.current = "";
      };
    }, []);

    return (
      <div
        className={className}
        ref={containerRef}
        style={{
          width: "100%",
          height: height,
          position: height ? undefined : "absolute",
          top: "40px",
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
    );
  }
);

CustomEdit.displayName = "CustomEdit";

export default CustomEdit;
