import { invoke } from "@tauri-apps/api/core";

export interface Params {
  resource: string;
  verb: string;
  name?: string;
  namespace?: string;
  selector?: string;
}

export type Method = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";

export interface KubernetesResponse<T> {
  items: T;
}

export const kubernetes_request = async <T>(
  method: Method,
  url: string,
  body?: T,
  headers?: Object
) => {
  const res = await invoke<KubernetesResponse<T>>("proxy_request", {
    method: method,
    url: url,
    body: body,
    headers: headers,
  });
  return res.items;
};
