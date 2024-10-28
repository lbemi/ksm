use crate::boot::config::KUBERNETES_LIST;
use kube::{
    api::{ApiResource, DynamicObject},
    config::KubeConfigOptions,
    discovery::{ApiCapabilities, Scope},
    Api, Client, Config, Discovery,
};

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

pub async fn dynamic_api(
    ar: ApiResource,
    caps: ApiCapabilities,
    client: Client,
    ns: Option<&str>,
    all: bool,
) -> Api<DynamicObject> {
    if caps.scope == Scope::Cluster || all {
        Api::all_with(client, &ar)
    } else if let Some(namespace) = ns {
        Api::namespaced_with(client, namespace, &ar)
    } else {
        Api::default_namespaced_with(client, &ar)
    }
}

pub fn resolve_api_resource(
    discovery: &Discovery,
    name: &str,
) -> Option<(ApiResource, ApiCapabilities)> {
    discovery
        .groups()
        .flat_map(|group| {
            group
                .resources_by_stability()
                .into_iter()
                .map(move |res| (group, res))
        })
        .filter(|(_, (res, _))| {
            name.eq_ignore_ascii_case(&res.kind) || name.eq_ignore_ascii_case(&res.plural)
        })
        .min_by_key(|(group, _res)| group.name())
        .map(|(_, res)| res)
}
