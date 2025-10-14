import { Deployment } from "kubernetes-models/apps/v1";
import { AppsV1Url, CoreV1Url, kubeApi } from "./cluster";
import { Pod } from "kubernetes-models/v1";

export const listDeployment = async (namespace?: string) => {
  return await kubeApi.get<Deployment>(CoreV1Url, "deployments", namespace);
};

export const getDeployment = async (name: string, namespace?: string) => {
  return await kubeApi.get_one<Deployment>(
    CoreV1Url,
    "deployments",
    namespace,
    name
  );
};

export const deleteDeployment = async (name: string, namespace?: string) => {
  return await kubeApi.delete(CoreV1Url, "deployments", namespace, name);
};

export const scaleDeployment = async (
  name: string,
  replicas: number,
  namespace?: string,
  patchPath: string = "scale"
) => {
  return await kubeApi.patch(
    CoreV1Url,
    "deployments",
    {
      spec: {
        replicas,
      },
    },
    namespace,
    name,
    patchPath,
    {
      "Content-Type": "application/merge-patch+json",
    }
  );
};

export const getPodsByLabel = async (
  name: string,
  labelSelector: string,
  namespace?: string
) => {
  return await kubeApi.get<Pod>(
    AppsV1Url,
    "pods",
    namespace,
    name,
    `lableSelector=${labelSelector}`
  );
};
