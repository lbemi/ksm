use crate::boot::server::AppData;
use crate::error::MyError;
use crate::service::pod::PodStruct;
use k8s_openapi::api::core::v1::Pod;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub async fn list_pods(
    cluster_name: &str,
    namespace: &str,
    state: State<'_, Mutex<AppData>>,
) -> Result<Vec<Pod>, MyError> {
    println!("namespace: {}, cluster_name: {cluster_name}", namespace);
    PodStruct::new(cluster_name, namespace, state)
        .await
        .list_pods()
        .await
}

// #[tauri::command]
// pub async fn get_pod_by_name(
//     cluster_name: &str,
//     name: String,
//     namespace: &str,
// ) -> Result<Pod, MyError> {
//     PodStruct::new(cluster_name, namespace)
//         .await
//         .get_pod_by_name(name)
//         .await
// }

// #[tauri::command]
// pub async fn delete_pod_by_name(
//     cluster_name: &str,
//     name: String,
//     namespace: &str,
// ) -> Result<String, MyError> {
//     PodStruct::new(cluster_name, namespace)
//         .await
//         .delete_pod_by_name(name)
//         .await
// }

// #[tauri::command]
// pub async fn create_pod(cluster_name: &str, pod: Pod, namespace: &str) -> Result<Pod, MyError> {
//     PodStruct::new(cluster_name, namespace)
//         .await
//         .create_pod(pod)
//         .await
// }
