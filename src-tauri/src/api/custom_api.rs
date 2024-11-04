use crate::{boot::server::AppData, error::MyError};
use anyhow::Context;
use kube::{
    api::{Api, DynamicObject, ListParams, ResourceExt},
    discovery::{ApiCapabilities, ApiResource, Scope},
    Client, Discovery,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Clone, PartialEq, Eq, Debug)]
enum Verb {
    Get,
    Delete,
    Edit,
    Watch,
    Apply,
}

impl Serialize for Verb {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(match self {
            Verb::Get => "get",
            Verb::Delete => "delete",
            Verb::Edit => "edit",
            Verb::Watch => "watch",
            Verb::Apply => "apply",
        })
    }
}

struct App {
    selector: Option<String>,
    name: Option<String>,
    dynamic_api: Api<DynamicObject>,
}
impl App {
    fn new(
        name: Option<String>,
        namespace: Option<String>,
        selector: Option<String>,
        ar: ApiResource,
        caps: ApiCapabilities,
        client: Client,
    ) -> Self {
        let dynamic_api = dynamic_api(ar, caps, client, namespace);
        Self {
            selector,
            name,
            dynamic_api: dynamic_api,
        }
    }

    async fn list(&self) -> Result<Vec<DynamicObject>, MyError> {
        let mut lp = ListParams::default();
        if let Some(label) = &self.selector {
            lp = lp.labels(label);
        }
        let result: Vec<_> = if let Some(n) = &self.name {
            vec![self.dynamic_api.get(n).await?]
        } else {
            self.dynamic_api.list(&lp).await?.items
        };
        // result
        //     .iter_mut()
        //     .for_each(|x| x.managed_fields_mut().clear()); // hide managed fields
        Ok(result)
    }
}

#[tauri::command]
pub async fn kubernetes_api(
    resource: &str,
    verb: &str,
    name: Option<String>,
    namespace: Option<String>,
    selector: Option<String>,
    state: State<'_, Mutex<AppData>>,
) -> Result<Vec<DynamicObject>, MyError> {
    let app = {
        let app_data = state.lock().unwrap();
        let discovery = app_data.discovery.as_ref().unwrap();
        let (ar, caps) = resolve_api_resource(&discovery, resource)
            .with_context(|| format!("resource {resource:?} not found in cluster"))?;
        tracing::info!(
            ?verb,
            ?resource,
            ?name,
            ?namespace,
            ?selector,
            "requested objects"
        );
        App::new(
            name,
            namespace,
            selector,
            ar,
            caps,
            app_data.client.clone().unwrap(),
        )
    };

    match verb {
        "GET" => app.list().await,
        _ => {
            println!("not implemented");
            Ok(vec![])
        }
    }
}

fn resolve_api_resource(
    discovery: &Discovery,
    name: &str,
) -> Option<(ApiResource, ApiCapabilities)> {
    // iterate through groups to find matching kind/plural names at recommended versions
    // and then take the minimal match by group.name (equivalent to sorting groups by group.name).
    // this is equivalent to kubectl's api group preference
    discovery
        .groups()
        .flat_map(|group| {
            group
                .resources_by_stability()
                .into_iter()
                .map(move |res| (group, res))
        })
        .filter(|(_, (res, _))| {
            // match on both resource name and kind name
            // ideally we should allow shortname matches as well
            name.eq_ignore_ascii_case(&res.kind) || name.eq_ignore_ascii_case(&res.plural)
        })
        .min_by_key(|(group, _res)| group.name())
        .map(|(_, res)| res)
}

fn dynamic_api(
    ar: ApiResource,
    caps: ApiCapabilities,
    client: Client,
    ns: Option<String>,
) -> Api<DynamicObject> {
    let all = ns.is_none();
    if caps.scope == Scope::Cluster || all {
        Api::all_with(client, &ar)
    } else if let Some(namespace) = ns {
        Api::namespaced_with(client, namespace.as_str(), &ar)
    } else {
        Api::default_namespaced_with(client, &ar)
    }
}
