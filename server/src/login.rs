use crate::error::Error;
use axum::{extract::State, Json};
use hmac::{Hmac, Mac};
use jwt::SignWithKey;
use secp256k1::{ecdsa::Signature, Message, PublicKey, Secp256k1};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::sync::RwLock;
use tokio_postgres::Client;

//JWT
#[derive(Serialize)]
pub struct JWT {
    token: String,
}

//User login Details
#[derive(Serialize, Deserialize)]
pub struct LoginData {
    signature: Vec<u8>,
    recid: u8,
    message: String,
    pub_key: Vec<u8>,
}

impl LoginData {
    fn check_digital_signature(&self) -> bool {
        let secp256k1 = Secp256k1::new();

        let mut hasher = Sha256::new();
        hasher.update(&self.message);
        let result = hasher.finalize();

        let message = Message::from_slice(&result).unwrap();
        let signature = Signature::from_compact(&self.signature[..]).unwrap();
        let public_key = PublicKey::from_slice(&self.pub_key).unwrap();

        secp256k1
            .verify_ecdsa(&message, &signature, &public_key)
            .is_ok()
    }
}

//To generate JWT TOKEN
pub async fn get_token(pub_key: &str, name: &str) -> Json<JWT> {
    let system_time = SystemTime::now();
    println!("{:?}", pub_key);
    println!("{:?}", system_time);
    let key: Hmac<Sha256> = Hmac::new_from_slice(b"wtsefhkjvsfvshkn").unwrap();
    let mut claims = BTreeMap::new();
    claims.insert("public_key", pub_key);
    claims.insert("name", name);
    let token_str = claims.sign_with_key(&key).unwrap();

    Json(JWT { token: token_str })
}

#[axum_macros::debug_handler]
//User login handler
pub async fn login(
    State(client): State<Arc<RwLock<Client>>>,
    Json(data): Json<LoginData>,
) -> Result<Json<JWT>, Error> {
    //Get digital Signature from user and verify
    //If correct issue token containing the public key and time
    print!("{:?}", data.pub_key);

    //Check if time is correct
    let time = SystemTime::now();
    let since_the_epoch = time
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    println!("{:?}", since_the_epoch);

    let res = data.check_digital_signature();

    if res {
        println!("Digital Signature is Correct");
        //Check if user Already registered

        let unlock_client = client.read().await;

        let check_user_exist = unlock_client
            .query(
                "SELECT name,publicKey from USERS where publicKey=$1",
                &[&hex::encode(&data.pub_key)],
            )
            .await;

        match check_user_exist {
            Ok(user) => {
                if !user.is_empty() {
                    let user_name: &str = user[0].get(0);
                    Ok(get_token(&hex::encode(&data.pub_key), user_name).await)
                } else {
                    println!("User not exist Please Sign In First");
                     Err(Error::AuthenticationError)
                }
            }
            Err(_) => Err(Error::SomethingElseWentWrong),
        }
    } else {
        println!("Incorrect");
        Err(Error::WrongDigitalSignature)
    }
}
