use futures::prelude::*;
use k8s_openapi::api::core::v1::Pod;
use kube::{
    api::{Api, ResourceExt, WatchEvent},
    runtime::{watcher, WatchStreamExt},
    Client,
};
use tracing::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let client = Client::try_default().await?;
    let api = Api::<Pod>::default_namespaced(client);
    let use_watchlist = std::env::var("WATCHLIST")
        .map(|s| s == "1")
        .unwrap_or(false);
    let wc: watcher::Config = if use_watchlist {
        // requires WatchList feature gate on 1.27 or later
        watcher::Config::default().streaming_lists()
    } else {
        watcher::Config::default().streaming_lists()
    };
    // let mut stream = api.watch(&Default::default(), "0").await?.boxed();
    // while let Some(status) = stream.try_next().await? {
    //     match status {
    //         WatchEvent::Modified(pod) => {
    //             println!("{:?}", pod.metadata.name);
    //         }
    //         _ => {
    //             println!("other: {:?}", status);
    //         }
    //     }
    // }
    watcher(api, wc)
        .applied_objects()
        .default_backoff()
        .try_for_each(|p| async move {
            info!("saw {}", p.name_any());
            if let Some(unready_reason) = pod_unready(&p) {
                warn!("{}", unready_reason);
            }
            Ok(())
        })
        .await?;
    Ok(())
}

fn pod_unready(p: &Pod) -> Option<String> {
    let status = p.status.as_ref().unwrap();
    if let Some(conds) = &status.conditions {
        let failed = conds
            .iter()
            .filter(|c| c.type_ == "Ready" && c.status == "False")
            .map(|c| c.message.clone().unwrap_or_default())
            .collect::<Vec<_>>()
            .join(",");
        if !failed.is_empty() {
            if p.metadata.labels.as_ref().unwrap().contains_key("job-name") {
                return None; // ignore job based pods, they are meant to exit 0
            }
            return Some(format!("Unready pod {}: {}", p.name_any(), failed));
        }
    }
    None
}
