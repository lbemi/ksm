// POST https://127.0.0.1:6443/apis/apps/v1/namespaces/default/deployments?fieldManager=kubectl-client-side-apply&fieldValidation=Strict
// I0911 15:32:54.633647    6025 round_trippers.go:469] Request Headers:
// I0911 15:32:54.633650    6025 round_trippers.go:473]     Accept: application/json

import { invoke } from "@tauri-apps/api/core";
import { KubernetesResponse } from "./cluster";

// I0911 15:32:54.633653    6025 round_trippers.go:473]     Content-Type: application/json
export const apply = async <T>(name: string, body: any, namespace?: string) => {
  await invoke<KubernetesResponse<T>>("proxy_request", {
    method: "POST",
    url: `/apis/apps/v1/namespaces/${namespace}/deployments/${name}?fieldManager=kubectl-client-side-apply&fieldValidation=Strict`,
    body: body,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
