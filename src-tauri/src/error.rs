use std::io;

use kube::config::KubeconfigError;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum MyError {
    #[error("KubeError: {0}")]
    KubeError(String),
    #[error("IOError: {0}")]
    IOError(String),
    #[error("SerdeYamlError: {0}")]
    SerdeYamlError(String),
    #[error("KubeconfigError: {0}")]
    KubeconfigError(String),
    #[error(" OtherError: {0}")]
    OtherError(String),
    #[error("Error: {0}")]
    WatchError(String),
    #[error("Error: {0}")]
    HttpError(String),
    #[error("Error: {0}")]
    NoClient(String),
    #[error("InvalidMethod: {0}")]
    InvalidMethod(String),
    #[error("InvalidUuid: {0}")]
    InvalidUuid(String),
}

impl From<kube::Error> for MyError {
    fn from(value: kube::Error) -> Self {
        MyError::KubeError(value.to_string())
    }
}

impl From<io::Error> for MyError {
    fn from(value: io::Error) -> Self {
        MyError::IOError(value.to_string())
    }
}

impl From<serde_yaml::Error> for MyError {
    fn from(value: serde_yaml::Error) -> Self {
        MyError::SerdeYamlError(value.to_string())
    }
}
impl From<KubeconfigError> for MyError {
    fn from(value: KubeconfigError) -> Self {
        MyError::KubeconfigError(value.to_string())
    }
}

impl From<anyhow::Error> for MyError {
    fn from(value: anyhow::Error) -> Self {
        MyError::OtherError(value.to_string())
    }
}

impl From<kube::runtime::watcher::Error> for MyError {
    fn from(value: kube::runtime::watcher::Error) -> Self {
        MyError::WatchError(value.to_string())
    }
}

impl From<http::Error> for MyError {
    fn from(value: http::Error) -> Self {
        MyError::HttpError(value.to_string())
    }
}
