use std::sync::Mutex;

use kube::{api::ListParams, discovery, Discovery};
use tauri::State;

use crate::{boot::server::AppData, utils::init_client};

#[derive(Clone, PartialEq, Eq, Debug)]
enum Verb {
    Get,
    Delete,
    Edit,
    Watch,
    Apply,
}
struct CustomResource {
    file: Option<std::path::PathBuf>,
    selector: Option<String>,
    namespace: Option<String>,
    all: bool,
    verb: Verb,
    resource: Option<String>,
    name: Option<String>,
}
// #[tauri::command]
// async fn custom_api(cr: &CustomResource, state: State<'_, Mutex<AppData>>) -> Result<(), String> {
//     let app_data = state.lock().unwrap();
//     if let Some(client) = &app_data.client {
//         let discovery = Discovery::new(client.clone()).run().await.unwrap();
//         if let Some(resource) = &cr.resource {
//             let (ar, caps) = init_client::resolve_api_resource(&discovery, resource)
//                 .with_context(|| format!("resource {resource:?} not found in cluster"))?;
//             let mut lp = ListParams::default();
//             if let Some(label) = &cr.selector {
//                 lp = lp.labels(label);
//             }
//             let api =
//                 init_client::dynamic_api(ar, caps, client.clone(), cr.namespace.as_deref(), cr.all)
//                     .await;
//             match cr.verb {
//                 Verb::Get => api.list(cr.name.as_deref(), lp).await?,
//                 Verb::Delete => api.delete(cr.name.as_deref(), lp).await?,
//                 Verb::Edit => api.edit(cr.name.as_deref(), lp).await?,
//                 Verb::Watch => api.watch(cr.name.as_deref(), lp).await?,
//                 Verb::Apply => api.apply(cr.name.as_deref(), lp).await?,
//             }
//         } else {
//             Err("no resource specified".to_string())?
//         }
//     }
//     Ok(())
// }
