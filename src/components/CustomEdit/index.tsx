import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import "./monaco-config";

interface CustomEditProps {
  data: string;
  readOnly?: boolean;
  height?: number;
  type?: string;
  scrollEnd?: boolean;
}

const CustomEdit = ({
  data,
  readOnly = true,
  height = 450,
  type = "yaml",
  scrollEnd = false,
}: CustomEditProps) => {
  // const [code, setCode] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollPosition = useRef<number>(0);

  // Helper function to check if value is number
  const isNumber = (value: any): boolean => {
    return /^[0-9]*$/.test(value);
  };

  const init = () => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      theme: "vs-dark",
      language: type,
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
      readOnly,
    });

    editorRef.current.setModel(monaco.editor.createModel(data, type));
    // setCode(editorRef.current.getValue());

    // editorRef.current.onDidChangeModelContent(() => {
    //   // setCode(editorRef.current.getValue());
    // });
  };

  // Initialize on mount
  useEffect(() => {
    init();
    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  // Watch for prop changes
  useEffect(() => {
    if (editorRef.current) {
      // Store current scroll position
      lastScrollPosition.current = editorRef.current.getScrollTop();

      const currentValue = editorRef.current.getValue();
      // Only update if content actually changed
      if (currentValue !== data) {
        const model = monaco.editor.createModel(data, type);
        editorRef.current.setModel(model);

        // Restore scroll position or scroll to end if requested
        if (scrollEnd) {
          editorRef.current.setScrollTop(editorRef.current.getScrollHeight());
        } else {
          editorRef.current.setScrollTop(lastScrollPosition.current);
        }
      }
    }
  }, [data, type, scrollEnd]);

  // Add configuration to enable smooth scrolling
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        smoothScrolling: true,
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: true,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          arrowSize: 30,
        },
      });
    }
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: isNumber(height) ? `${height}px` : height,
        }}
      />
    </div>
  );
};

export default CustomEdit;
