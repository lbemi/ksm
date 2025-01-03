use crate::boot::setup::AppData;
use crate::error::MyError;
use http::Request;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub async fn proxy_request(
    method: &str,
    url: &str,
    state: State<'_, Mutex<AppData>>,
) -> Result<serde_json::Value, MyError> {
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };

    let req: Request<Vec<u8>> = match method.to_uppercase().as_str() {
        "POST" => http::Request::post(url),
        "DELETE" => http::Request::delete(url),
        "PUT" => http::Request::put(url),
        "PATCH" => http::Request::patch(url),
        "GET" => http::Request::get(url),
        _ => return Err(MyError::InvalidMethod(method.to_string())),
    }
    .body(Default::default())?;

    let res = client.request::<serde_json::Value>(req).await?;
    Ok(res)
}
