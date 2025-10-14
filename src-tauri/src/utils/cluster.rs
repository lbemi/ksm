// use anyhow::Context;
use kube::{Client, Config};

use crate::error::MyError;

pub fn generate_client(kube_config: &Config) -> Result<Client, MyError> {
    let kube_client = Client::try_from(kube_config.clone())?;
    Ok(kube_client)
}
