import { invoke } from "@tauri-apps/api/core";

export interface Params {
  resource: string;
  verb: string;
  name?: string;
  namespace?: string;
  selector?: string;
}
export const list_namespaces = async () => {
  await invoke("proxy_get", {
    url: "/api/v1/namespaces?limit=500",
  });
};
