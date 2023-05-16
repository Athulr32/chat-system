use crate::error::Error;
use axum::{extract::State, Json};
use jwt::SignWithKey;
use secp256k1::{ecdsa::Signature, Message, PublicKey, Secp256k1};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, sync::Arc, time::SystemTime};
use tokio::sync::RwLock;
use tokio_postgres::Client;

use hmac::{Hmac, Mac};
//User Register Details
#[derive(Serialize, Deserialize)]
pub struct RegisterData {
    signature: Vec<u8>,
    recid: u8,
    message: String,
    pub_key: Vec<u8>,
    name: String,
}

//Response to User
#[derive(Serialize, Deserialize)]
pub struct JWT {
    token: String,
}

impl RegisterData {
    fn check_digital_signature(&self) -> bool {
        let secp256k1 = Secp256k1::new();

        let mut hasher = Sha256::new();
        hasher.update(&self.message);
        let result = hasher.finalize();

        let message = Message::from_slice(&result).unwrap();
        let signature = Signature::from_compact(&self.signature[..]).unwrap();
        let public_key = PublicKey::from_slice(&self.pub_key).unwrap();

        let res = secp256k1
            .verify_ecdsa(&message, &signature, &public_key)
            .is_ok();

        res
    }
}

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
pub async fn register(
    State(client): State<Arc<RwLock<Client>>>,
    Json(data): Json<RegisterData>,
) -> Result<Json<JWT>, Error> {
    let check_ecdsa = data.check_digital_signature();

    if check_ecdsa {
        let unlock_client = client.read().await;

        let check_public_key_exist = unlock_client
            .query(
                "SELECT publicKey from USERS where publicKey=$1",
                &[&hex::encode(&data.pub_key)],
            )
            .await;

        let check_name_exist = unlock_client
            .query("SELECT name from USERS where name=$1", &[&data.name])
            .await;

        if let Ok(user) = check_public_key_exist {
            if user.len() > 0 {
                return Err(Error::UserAlreadyExist);
            }
        } else if let Err(_) = check_public_key_exist {
            return Err(Error::DbError);
        }

        if let Ok(name) = check_name_exist {
            if name.len() > 0 {
                return Err(Error::UserNameAlreadyExist);
            } else {
                //Register the user

                let unlock_client = client.read().await;
                let register_user = unlock_client
                    .query(
                        "INSERT INTO USERS VALUES($1,$2)",
                        &[&data.name, &hex::encode(&data.pub_key)],
                    )
                    .await;

                match register_user {
                    Ok(_) => {
                        return Ok(get_token(&hex::encode(&data.pub_key), &data.name).await);
                    }
                    Err(e) => {
                        println!("{:?}", e);
                        return Err(Error::SomethingElseWentWrong);
                    }
                }
            }
        } else if let Err(_) = check_name_exist {
            return Err(Error::DbError);
        }

        Err(Error::SomethingElseWentWrong)
    } else {
        Err(Error::WrongDigitalSignature)
    }
}