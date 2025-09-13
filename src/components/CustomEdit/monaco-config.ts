import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import yamlWorker from "monaco-yaml/yaml.worker?worker";

declare global {
  interface Window {
    MonacoEnvironment: any;
  }
}

self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "yaml") {
      return new yamlWorker();
    }
    return new editorWorker();
  },
};

// 预加载必要的语言支持
monaco.languages.register({ id: "yaml" });
monaco.languages.register({ id: "json" });
