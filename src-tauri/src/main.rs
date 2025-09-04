// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use boot::server;

mod api;
mod boot;
mod error;
mod handler;
mod resource;
mod tray;
mod utils;
fn main() {
    server::run()
}
