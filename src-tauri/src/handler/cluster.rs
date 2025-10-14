use std::time::Duration;

use kube::{
    config::{KubeConfigOptions, Kubeconfig},
    Config,
};

use crate::{error::MyError, resource, utils};

pub async fn get_cluster(
    cluster_config: Kubeconfig,
) -> Result<Vec<resource::cluster::Cluster>, MyError> {
    std::env::set_var("HTTPS_PROXY", "");
    std::env::set_var("https_proxy", "");
    let named_clusters = cluster_config.clusters.clone();
    let mut clusters = Vec::new();

    for c in named_clusters {
        let mut cluster_config = cluster_config.clone();
        cluster_config.current_context = Some(c.name.clone());

        let mut info = resource::cluster::Cluster {
            name: c.name.clone(),
            url: c.cluster.unwrap().server.unwrap_or_default(),
            version: "Unknown".to_string(),
            platform: "Unknown".to_string(),
            status: false,
        };
        if let Ok(mut config) =
            Config::from_custom_kubeconfig(cluster_config, &KubeConfigOptions::default()).await
        {
            config.connect_timeout = Some(Duration::from_secs(2));
            if let Ok(client) = utils::cluster::generate_client(&config) {
                if let Ok(api_resource) = client.apiserver_version().await {
                    info.version = api_resource.git_version;
                    info.platform = api_resource.platform;
                    info.status = true;
                }
            }
        }
        clusters.push(info);
    }

    Ok(clusters)
}
