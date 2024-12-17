// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use ort::execution_providers::{
    CUDAExecutionProvider,
    ROCmExecutionProvider
};

#[cfg(any(target_os = "macos", target_os = "ios", target_os = "tvos"))]
use ort::execution_providers::CoreMLExecutionProvider;

fn main() {
    tracing_subscriber::fmt::init();
    let _ = ort::init()
        .with_execution_providers([
            CUDAExecutionProvider::default().build(),
            #[cfg(any(target_os = "macos", target_os = "ios", target_os = "tvos"))]
            CoreMLExecutionProvider::default().build(),
            ROCmExecutionProvider::default().build()
        ])
        .commit().map_err(|err| {
            println!("Failed to initialize ORT: {:?}", err);
        });

    labability_lib::run()
}
