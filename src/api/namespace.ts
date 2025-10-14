import { invoke } from "@tauri-apps/api/core";
import { Namespace } from "kubernetes-types/core/v1";
import { kubeApi, KubernetesResponse } from "./cluster";
import { AppsV1Url } from "./cluster";

export interface Params {
  resource: string;
  verb: string;
  name?: string;
  namespace?: string;
  selector?: string;
}

export interface ApiError {
  message: string;
  code?: number;
  status?: string;
}

export const list_namespaces = async (): Promise<Namespace[]> => {
  try {
    return await kubeApi.get<Namespace>(AppsV1Url, "namespaces");
  } catch (error) {
    console.error("Failed to list namespaces:", error);
    throw new Error(
      "Failed to fetch namespaces. Please check your cluster connection."
    );
  }
};

export const get_namespace = async (name: string): Promise<Namespace> => {
  try {
    return await kubeApi.get_one<Namespace>(AppsV1Url, "namespaces", name);
  } catch (error) {
    console.error(`Failed to get namespace ${name}:`, error);
    throw new Error(
      `Failed to fetch namespace ${name}. Please check if the namespace exists.`
    );
  }
};

export const delete_namespace = async (name: string): Promise<void> => {
  try {
    await invoke<KubernetesResponse<unknown>>("proxy_request", {
      method: "DELETE",
      url: `/api/v1/namespaces/${name}`,
    });
  } catch (error) {
    console.error(`Failed to delete namespace ${name}:`, error);
    throw new Error(
      `Failed to delete namespace ${name}. Please check permissions and dependencies.`
    );
  }
};

export const create_namespace = async (
  namespace: Namespace
): Promise<Namespace> => {
  try {
    return await kubeApi.post(AppsV1Url, "namespaces", namespace);
  } catch (error) {
    console.error("Failed to create namespace:", error);
    throw new Error(
      "Failed to create namespace. Please check the namespace name and permissions."
    );
  }
};
