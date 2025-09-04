use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Cluster {
    pub name: String,
    pub url: String,
    pub version: String,
    pub platform: String,
    pub status: bool,
}
