use aes_gcm::{
    aead::{Payload, KeyInit, Aead},
    Aes256Gcm, Nonce, Key, AesGcm
};
use std::{fs, path::Path};

static AAD_LENGTH: usize = 1024;
static IV_LENGTH: usize = 12;

#[tauri::command(async)]
pub fn decrypt_content(path: String, dest: String, keystore: String) -> Result<(), String> {

    let input_file_path: &Path = Path::new(&path);

    // let input_file_name = input_file_path.file_name().unwrap();

    // let new_location: &Path = Path::new(&dest);

    if !input_file_path.exists() || !input_file_path.is_file() {
        return Err("Invalid file path, only files are supported".into());
    }

    // if input_file_path.extension().unwrap() != "jpg" {
    //     return Err("Invalid file type, only jpg files are supported".into());
    // }

    let input_data = fs::read(path).unwrap();

    let keystore = fs::read(keystore).unwrap();

    let aad = &keystore[..AAD_LENGTH];
    let iv: &[u8] = &keystore[AAD_LENGTH..(AAD_LENGTH + IV_LENGTH)];
    let key: &[u8] = &keystore[(AAD_LENGTH + IV_LENGTH)..];

    let key: &Key<Aes256Gcm> = key.into();

    let cipher: AesGcm<aes_gcm::aes::Aes256, _, _> = Aes256Gcm::new(&key);

    let nonce = Nonce::from_slice(iv);

    let payload = Payload {
        msg: &input_data,
        aad,
    };

    let output = cipher.decrypt(&nonce, payload).unwrap();

    // if inference.unwrap_or(false) {
        
    // }

    fs::write(dest, &output).unwrap();

    // let mut file = match File::create(new_location.join(input_file_name)) {
    //     Ok(f) => f,
    //     Err(e) => {
    //         println!("Error creating file: {}", e);
    //         return Err(format!("Error creating file: {}", e))
    //     }
    // };

    // file.write_all(&output).unwrap();

    Ok(())
}