import { invoke } from "@tauri-apps/api/core";

export interface Params {
    resource: string;
    verb: string;
    name?: string;
    namespace?: string;
    selector?: string;
}
export const list_pods =async (namespace: string)=>{
    await invoke("kubernetes_api", {
        resource: "pods",
        verb: "GET",
        namespace: namespace
    });
}