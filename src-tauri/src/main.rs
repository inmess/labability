// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use ort::execution_providers::{
    CUDAExecutionProvider,
    CoreMLExecutionProvider,
    ROCmExecutionProvider
};


fn main() {
    let _ = ort::init()
        .with_execution_providers([
            CUDAExecutionProvider::default().build(),
            CoreMLExecutionProvider::default().build(),
            ROCmExecutionProvider::default().build()
        ])
        .commit().map_err(|err| {
            println!("Failed to initialize ORT: {:?}", err);
        });

    labability_lib::run()
}
