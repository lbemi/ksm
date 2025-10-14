import { Node } from "kubernetes-models/v1";
import { AppsV1Url, kubeApi } from "./cluster";

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

export const cordonNode = async (name: string): Promise<Node> => {
  try {
    return await kubeApi.patch(
      AppsV1Url,
      "nodes",
      {
        spec: { unschedulable: true },
      },
      undefined,
      name
    );
  } catch (error) {
    console.error(`Failed to cordon node ${name}:`, error);
    throw new Error(`Failed to cordon node ${name}. Please check permissions.`);
  }
};

export const uncordonNode = async (name: string): Promise<Node> => {
  try {
    return await kubeApi.patch(
      AppsV1Url,
      "nodes",
      {
        spec: { unschedulable: false },
      },
      undefined,
      name
    );
  } catch (error) {
    console.error(`Failed to uncordon node ${name}:`, error);
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
    console.error(`Failed to drain node ${name}:`, error);
    throw new Error(
      `Failed to drain node ${name}. Please check permissions and pod dependencies.`
    );
  }
};
