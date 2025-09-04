use crate::{
    boot::setup::AppData, error::MyError, handler::cluster::get_cluster,
    resource::cluster::Cluster, utils,
};
use kube::{config::KubeConfigOptions, Config, Discovery};
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub async fn list_clusters(state: State<'_, Mutex<AppData>>) -> Result<Vec<Cluster>, MyError> {
    let kubernetes_configs = {
        let app_data = state.lock().unwrap();
        app_data.kubernetes_configs.clone()
    };
    let clusters = get_cluster(kubernetes_configs).await?;
    Ok(clusters)
}

#[tauri::command]
pub async fn switch_cluster(
    cluster_name: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, MyError> {
    let kube_config = {
        let mut app_data = state.lock().unwrap();
        app_data.kubernetes_configs.current_context = Some(cluster_name.clone());
        app_data.kubernetes_configs.clone()
    };

    let config = Config::from_custom_kubeconfig(kube_config, &KubeConfigOptions::default()).await?;
    let client = utils::cluster::generate_client(&config)?;
    let discovery = Discovery::new(client.clone()).run().await?;

    let mut app_data = state.lock().unwrap();
    app_data.client = Some(client);
    app_data.discovery = Some(discovery);

    tracing::info!("Switched to cluster {}", cluster_name);
    Ok(cluster_name)
}
