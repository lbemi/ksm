use crate::boot::server::AppData;
use crate::error::MyError;
use crate::service::pod::PodStruct;
use futures::{TryFutureExt, TryStreamExt};
use hyper::client;
use k8s_openapi::api::core::v1::Pod;
use kube::runtime::{watcher, WatchStreamExt};
use kube::{Api, Client};
use std::sync::{Arc, Mutex};
use tauri::State;
use tokio::net::TcpStream;

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

#[tauri::command]
pub async fn watch_pods(namespace: &str, state: State<'_, Mutex<AppData>>) -> Result<(), MyError> {
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };

    let api = Api::<Pod>::namespaced(client, namespace);
    watcher(api, watcher::Config::default())
        .default_backoff()
        .try_for_each(|event| async move {
            println!("{:?}", event);
            Ok(())
        })
        .await?;
    Ok(())
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
