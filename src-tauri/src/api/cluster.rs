use crate::{boot::setup::AppData, error::MyError};
use kube::{
    config::{KubeConfigOptions, NamedCluster},
    Client, Config, Discovery,
};
use std::sync::Mutex;
use tauri::State;
use tokio::net::TcpListener;
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
    set_no_proxy();
    let kube_config = {
        let mut app_data = state.lock().unwrap();
        app_data.kubernetes_configs.current_context = Some(cluster_name.clone());
        app_data.kubernetes_configs.clone()
    };

    let config = Config::from_custom_kubeconfig(kube_config, &KubeConfigOptions::default()).await?;
    let client = Client::try_from(config)?;
    let discovery = Discovery::new(client.clone()).run().await?;
    let listener = TcpListener::bind("0.0.0.0:38011").await?;

    let mut app_data = state.lock().unwrap();
    app_data.client = Some(client);
    app_data.discovery = Some(discovery);
    app_data.websocket_listener = Some(listener);

    tracing::info!("Switched to cluster {}", cluster_name);
    Ok(cluster_name)
}

fn set_no_proxy() {
    std::env::set_var("HTTPS_PROXY", "");
    std::env::set_var("https_proxy", "");
}
