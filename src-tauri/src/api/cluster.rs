use crate::{boot::server::AppData, error::MyError};
use kube::{
    config::{KubeConfigOptions, Kubeconfig, NamedCluster},
    Client, Config,
};
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub async fn list_clusters(state: State<'_, Mutex<AppData>>) -> Result<Vec<NamedCluster>, MyError> {
    let app_data = state.lock().unwrap();
    println!(
        "current context: {:?}",
        app_data.kubernetes_configs.current_context
    );
    Ok(app_data.kubernetes_configs.clusters.clone())
}

#[tauri::command]
pub async fn switch_cluster(
    cluster_name: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, String> {
    let config = {
        let mut app_data = state.lock().unwrap();
        app_data.kubernetes_configs.current_context = Some(cluster_name.clone());
        app_data.kubernetes_configs.clone()
    };
    let client = generate_client(config).await;
    state.lock().unwrap().client = client;
    Ok(cluster_name)
}

async fn generate_client(config: Kubeconfig) -> Option<Client> {
    let c = Config::from_custom_kubeconfig(config, &KubeConfigOptions::default())
        .await
        .unwrap();
    let client = Client::try_from(c);
    match client {
        Ok(client) => Some(client),
        Err(e) => {
            println!("{:?}", e);
            None
        }
    }
}
