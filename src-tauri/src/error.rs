use std::io;

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
