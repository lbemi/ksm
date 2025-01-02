use crate::{boot::setup::AppData, error::MyError};
use kube::{
    config::{KubeConfigOptions, NamedCluster},
    Client, Config, Discovery,
};
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub async fn list_clusters(state: State<'_, Mutex<AppData>>) -> Result<Vec<NamedCluster>, MyError> {
    let app_data = state.lock().unwrap();
    Ok(app_data.kubernetes_configs.clusters.clone())
}

#[tauri::command]
pub async fn switch_cluster(
    cluster_name: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, MyError> {
    let config = {
        let mut app_data = state.lock().unwrap();
        app_data.kubernetes_configs.current_context = Some(cluster_name.clone());
        app_data.kubernetes_configs.clone()
    };

    let config = Config::from_custom_kubeconfig(config, &KubeConfigOptions::default()).await?;
    let client = Client::try_from(config)?;
    let discovery = Discovery::new(client.clone()).run().await?;

    let mut app_data = state.lock().unwrap();
    app_data.client = Some(client);
    app_data.discovery = Some(discovery);
    tracing::info!("Switched to cluster {}", cluster_name);
    Ok(cluster_name)
}
