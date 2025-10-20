import { Node } from "kubernetes-models/v1";
import { AppsV1Url, kubeApi } from "./cluster";
import { invoke } from "@tauri-apps/api/core";

export interface ApiError {
  message: string;
  code?: number;
  status?: string;
}

export const listNodes = async (): Promise<Node[]> => {
  try {
    return await kubeApi.get<Node>(AppsV1Url, "nodes");
  } catch (error) {
    console.error("Failed to list nodes:", error);
    throw new Error(
      "Failed to fetch nodes. Please check your cluster connection."
    );
  }
};

export const getNode = async (name: string): Promise<Node> => {
  try {
    return await kubeApi.get_one<Node>(AppsV1Url, "nodes", undefined, name);
  } catch (error) {
    console.error(`Failed to get node ${name}:`, error);
    throw new Error(
      `Failed to fetch node ${name}. Please check if the node exists.`
    );
  }
};
// PATCH https://127.0.0.1:57032/api/v1/nodes/kind-3m-3s-worker3
// Content-Type: application/strategic-merge-patch+json

export const cordonNode = async (name: string): Promise<Node> => {
  try {
    return await invoke<Node>("proxy_request", {
      method: "PATCH",
      url: `/api/v1/nodes/${name}`,
      body: {
        spec: { unschedulable: true },
      },
      headers: {
        "Content-Type": "application/strategic-merge-patch+json",
      },
    });
  } catch (error) {
    throw new Error(`Failed to cordon node ${name}. Please check permissions.`);
  }
};

export const uncordonNode = async (name: string): Promise<Node> => {
  try {
    return await invoke<Node>("proxy_request", {
      method: "PATCH",
      url: `/api/v1/nodes/${name}`,
      body: {
        spec: { unschedulable: false },
      },
      headers: {
        "Content-Type": "application/strategic-merge-patch+json",
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to uncordon node ${name}. Please check permissions.`
    );
  }
};

export const drainNode = async (name: string): Promise<Node> => {
  try {
    // This would typically involve evicting all pods from the node
    // For now, we'll just cordon the node
    return await cordonNode(name);
  } catch (error) {
    throw new Error(
      `Failed to drain node ${name}. Please check permissions and pod dependencies.`
    );
  }
};

// Taint management interfaces
export interface Taint {
  key: string;
  value?: string;
  effect: "NoSchedule" | "PreferNoSchedule" | "NoExecute";
}

export const addTaint = async (name: string, taint: Taint): Promise<Node> => {
  try {
    const currentNode = await getNode(name);
    const currentTaints = currentNode.spec?.taints || [];

    const existingTaintIndex = currentTaints.findIndex(
      (t) => t.key === taint.key
    );
    let newTaints;

    if (existingTaintIndex >= 0) {
      newTaints = [...currentTaints];
      newTaints[existingTaintIndex] = taint;
    } else {
      newTaints = [...currentTaints, taint];
    }

    return await invoke<Node>("proxy_request", {
      method: "PATCH",
      url: `/api/v1/nodes/${name}`,
      body: {
        spec: { taints: newTaints },
      },
      headers: {
        "Content-Type": "application/strategic-merge-patch+json",
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to add taint to node ${name}. Please check permissions.`
    );
  }
};

export const removeTaint = async (
  name: string,
  taintKey: string
): Promise<Node> => {
  try {
    const currentNode = await getNode(name);
    const currentTaints = currentNode.spec?.taints || [];
    const newTaints = currentTaints.filter((t) => t.key !== taintKey);

    return await invoke<Node>("proxy_request", {
      method: "PATCH",
      url: `/api/v1/nodes/${name}`,
      body: {
        spec: { taints: newTaints },
      },
      headers: {
        "Content-Type": "application/strategic-merge-patch+json",
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to remove taint from node ${name}. Please check permissions.`
    );
  }
};
