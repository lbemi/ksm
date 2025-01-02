use crate::boot::setup::AppData;
use crate::error::MyError;
use http::Request;
use std::sync::Mutex;
use tauri::State;
#[tauri::command]
pub async fn proxy_get(
    url: &str,
    state: State<'_, Mutex<AppData>>,
) -> Result<serde_json::Value, MyError> {
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };

    let req: Request<Vec<u8>> = http::Request::get(url).body(Default::default())?;
    let res = client.request::<serde_json::Value>(req).await?;
    Ok(res)
}

#[tauri::command]
pub async fn proxy_delete(
    url: &str,
    state: State<'_, Mutex<AppData>>,
) -> Result<serde_json::Value, MyError> {
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };

    let req: Request<Vec<u8>> = http::Request::delete(url).body(Default::default())?;
    let res = client.request::<serde_json::Value>(req).await?;
    Ok(res)
}

#[tauri::command]
pub async fn proxy_post(
    url: &str,
    state: State<'_, Mutex<AppData>>,
) -> Result<serde_json::Value, MyError> {
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };
    let req: Request<Vec<u8>> = http::Request::post(url).body(Default::default())?;
    let res = client.request::<serde_json::Value>(req).await?;
    Ok(res)
}

#[tauri::command]
pub async fn proxy_put(
    url: &str,
    state: State<'_, Mutex<AppData>>,
) -> Result<serde_json::Value, MyError> {
    let client = {
        let app_data = state.lock().unwrap();
        app_data.client.clone().unwrap()
    };
    let req: Request<Vec<u8>> = http::Request::put(url).body(Default::default())?;
    let res = client.request::<serde_json::Value>(req).await?;
    Ok(res)
}
