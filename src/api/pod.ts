import { createWindow } from "@/utils/windows/actions";
import { AppsV1Url, kubeApi } from "./cluster";
import { Pod } from "kubernetes-models/v1";

// Constants
const WINDOW_CONFIG = {
  x: 600,
  y: 800,
  width: 1100,
  height: 700,
} as const;
export const listPod = async (namespace?: string) => {
  return await kubeApi.get<Pod>(AppsV1Url, "pods", namespace);
};

export const getPod = async (name: string, namespace?: string) => {
  return await kubeApi.get_one<Pod>(AppsV1Url, "pods", namespace, name);
};

export const deletePod = async (name: string, namespace?: string) => {
  return await kubeApi.delete(AppsV1Url, "pods", namespace, name);
};
export const createLogWindow = async (
  name: string,
  namespace?: string,
  containerName?: string
) => {
  await createWindow({
    label: `${name}_log`,
    title: `${name}_log`,
    url: `/log/${name}/${namespace}?container=${containerName}`,
    ...WINDOW_CONFIG,
  });
};

export const createTerminalWindow = async (
  name: string,
  namespace?: string,
  containerName?: string
) => {
  await createWindow({
    label: `${name}_terminal`,
    title: `${name}_terminal`,
    url: `/terminal/${name}/${namespace}?container=${containerName}`,
    ...WINDOW_CONFIG,
  });
};
