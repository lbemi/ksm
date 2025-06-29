use crate::boot::setup::AppData;
use crate::error::MyError;
use http::{header, Request};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;
use tracing::info;

#[tauri::command]
pub async fn proxy_request(
    method: &str,
    url: &str,
    body: Option<serde_json::Value>,
    headers: Option<HashMap<String, String>>,
    state: State<'_, Mutex<AppData>>,
) -> Result<serde_json::Value, MyError> {
    info!("proxy_request url: {}", url);
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };

    let req: Request<Vec<u8>> = match method.to_uppercase().as_str() {
        "POST" => http::Request::post(url),
        "DELETE" => http::Request::delete(url),
        "PUT" => http::Request::put(url),
        "PATCH" => {
            let mut req = http::Request::patch(url);
            if let Some(headers) = headers {
                for (key, value) in headers {
                    req.headers_mut().unwrap().insert(
                        key.parse::<header::HeaderName>().unwrap(),
                        value.parse::<header::HeaderValue>().unwrap(),
                    );
                }
            }
            req
        }
        "GET" => http::Request::get(url),
        _ => return Err(MyError::InvalidMethod(method.to_string())),
    }
    .body(body.unwrap_or_default().to_string().as_bytes().to_vec())?;

    let res = client.request::<serde_json::Value>(req).await?;
    Ok(res)
}
