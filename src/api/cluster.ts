import { invoke } from "@tauri-apps/api/core";
import { editor } from "monaco-editor";

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

class ApiClient {
  private generateUrl(
    url: string,
    resource: string,
    namespace?: string,
    name?: string
  ) {
    let endpoint =
      namespace && namespace != "all"
        ? `${url}/namespaces/${namespace}/${resource}`
        : `${url}/${resource}`;
    endpoint = name ? `${endpoint}/${name}` : endpoint;
    return endpoint;
  }

  async get<T>(
    url: string,
    resource: string,
    namespace?: string,
    name?: string
  ) {
    let endpoint = this.generateUrl(url, resource, namespace, name);
    const res = await invoke<KubernetesResponse<T>>("proxy_request", {
      method: "GET",
      url: endpoint,
    });
    return res.items as Array<T>;
  }

  async post(url: string, resource: string, body: any, namespace?: string) {
    let endpoint = this.generateUrl(url, resource, namespace);
    const res = await invoke<KubernetesResponse<any>>("proxy_request", {
      method: "POST",
      url: endpoint,
      body: body,
    });
    return res.items;
  }
}

export const CoreV1Url = "/apis/apps/v1";
export const AppsV1Url = "/api/v1";

export const apiClient = new ApiClient();
