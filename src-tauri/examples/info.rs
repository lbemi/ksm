use kube::Client;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let client = Client::try_default().await?;
    let api_resource = client.apiserver_version().await?;
    info!("api_resource: {:?}", api_resource);
    Ok(())
}
