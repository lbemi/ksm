use crate::boot::config::KUBERNETES_LIST;
use kube::{config::KubeConfigOptions, Client, Config};

pub async fn generate_client(cluster_name: &str) -> Option<Client> {
    let configs = KUBERNETES_LIST.get();
    match configs {
        Some(config) => {
            for context in config.contexts.iter() {
                if let Some(c) = context.context.as_ref() {
                    if c.cluster == cluster_name {
                        let kube_config_options = KubeConfigOptions {
                            context: Some(context.name.clone()),
                            cluster: Some(c.cluster.clone()),
                            user: Some(c.user.clone()),
                        };
                        let kube_config =
                            Config::from_custom_kubeconfig(config.clone(), &kube_config_options)
                                .await;
                        if let Ok(cc) = kube_config {
                            match Client::try_from(cc) {
                                Ok(client) => {
                                    return Some(client);
                                }
                                Err(e) => {
                                    println!("{:?}", e);
                                    return None;
                                }
                            }
                        } else {
                            return None;
                        }
                    }
                }
            }
            None
        }
        None => None,
    }
}
