use crate::boot::setup::AppData;
use crate::error::MyError;
use futures::TryStreamExt;
use k8s_openapi::api::core::v1::Pod;
use kube::runtime::{watcher, WatchStreamExt};
use kube::Api;
use std::sync::Mutex;
use tauri::State;

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
