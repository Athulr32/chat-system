use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
    Extension,
};
use futures_util::{lock::Mutex, SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio_postgres::{Client, Error};

use std::{
    collections::HashMap,
    sync::Arc,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::sync::{broadcast, RwLock};

use hmac::{Hmac, Mac};
use jwt::VerifyWithKey;

use serde_json::json;
use sha2::Sha256;
use std::collections::BTreeMap;

//User message
#[derive(Serialize, Deserialize, Clone, Default, Debug)]
pub struct UserMessage {
    uid: String,
    message_type: String,
    cipher: String,
    public_key: String,
}

pub struct ReceiverMessage {}
#[derive(Deserialize, Debug, Serialize)]
struct SocketAuth {
    token: String,
}

// #[derive(Serialize, Deserialize, Clone, Default, Debug)]
// pub struct ReceiverMessage {
//     message_type:
//     cipher: String,
// }

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(state): Extension<Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>>,
    State(db): State<Arc<RwLock<Client>>>,
) -> Response {
    //upgrade the websocket connection
    ws.on_failed_upgrade(|_| {})
        .on_upgrade(move |socket| handle_socket(socket, state, db))
}

async fn handle_socket(
    socket: WebSocket,
    state: Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>,
    client: Arc<RwLock<Client>>,
) {
    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = broadcast::channel(100);

    //Send message to user itself
    let handler = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            println!("{msg}");
            let send_to_client = sender.send(Message::Text(msg)).await;

            if send_to_client.is_err() {

                //If sending failed Add the message to database
            }
        }
    });

    //Wait for message from user
    tokio::spawn(async move {
        let mut auth = false;
        let mut pk = String::from("");

        while let Some(Ok(socket_message)) = receiver.next().await {
            match socket_message {
                Message::Text(msg) => {
                    //User authentication to Web Socket
                    if !auth {
                        let foo: Result<SocketAuth, serde_json::Error> = serde_json::from_str(&msg);
                        println!("{:?}",msg);
                        if let Ok(auth_details) = foo {
                            //Check if details are correct
                            //If yes Add to authenticated pool
                            //Add the public key and channel

                            let token = auth_details.token.to_string();

                            let key: Hmac<Sha256> =
                                Hmac::new_from_slice(b"wtsefhkjvsfvshkn").unwrap();

                            let claims: Result<BTreeMap<String, String>, jwt::Error> =
                                token.verify_with_key(&key);

                            if let Ok(claim) = claims {
                                pk = claim["public_key"].to_string();
                                let mut muttex = state.lock().await;
                                muttex.insert(pk.to_string(), tx.clone());

                                auth = true;
                                //Check if the user didn't recieve any previous message
                                //If not give info in the JSOn
                                // will be done at last
                                tx.send(
                                    r#"{
                                        "type":"authentication",
                                        "status":"true",
                                        "message":"user authenticated"
                                }"#
                                    .to_string(),
                                )
                                .unwrap();

                            continue;
                            } else {
                                tx.send(
                                    r#"{
                                        "type":"authentication",
                                        "status":"false",
                                        "message":"invalid key"
                                    }"#
                                    .to_string(),
                                )
                                .unwrap();

                                continue;
                            }
                        } else {
                            //Client sent invalid format
                            tx.send(
                                r#"{
                                    "type":"authentication",
                                    "status":"false",
                                    "message":"invalid format"
                                 }"#
                                .to_string(),
                            )
                            .unwrap();

                            continue;
                        }
                    } else {
                        //User message
                        let get_msg: Result<serde_json::Value, serde_json::Error> = serde_json::from_str(&msg);

                        if let Err(_) = get_msg{
                              //Client sent invalid format
                              tx.send(
                                r#"{
                                    "type":"message_format",
                                    "status":"false",
                                    "message":"send valid json"
                                 }"#
                                .to_string(),
                            )
                            .unwrap();

                            continue;
                        }

                        let get_msg: serde_json::Value= serde_json::from_str(&msg).unwrap();

                        let message_type = get_msg.get("message_type").unwrap().as_str().unwrap();

                        println!("{}", message_type);

                        match message_type {
                            "private_message" => {
                                let user_message: UserMessage = serde_json::from_str(&msg).unwrap();

                                //Reciever public key
                                let rec_pubkey = user_message.public_key.clone();
                                let uid = user_message.uid.clone();

                                let unlock_state = state.lock().await;

                                //Check whether reciever is online
                                let tr = unlock_state.get(&rec_pubkey);

                                if let Some(tr) = tr {
                                    //If user is online
                                    //Send message to user

                                    let send_message = tr.send(
                                        serde_json::to_string(&UserMessage {
                                            cipher: user_message.cipher.clone(),
                                            message_type: user_message.message_type.clone(),
                                            public_key: pk.clone(),
                                            uid: "Id".to_string(),
                                        })
                                        .unwrap(),
                                    );

                                    if let Err(e) = send_message {
                                        //If sending messages to reciever failed
                                        //Add to database
                                        let insert_msg = add_message_to_database(
                                            &client,
                                            &pk,
                                            &user_message,
                                            &uid,
                                        )
                                        .await;

                                        let data = json!({
                                            "type":"status",
                                            "uid":uid,
                                            "message_sent":true,
                                            "status":"user offline"
                                        })
                                        .to_string();

                                        let _ = tx.send(data);
                                    } else {

                                        //If sending message to reciever is successful
                                        let data = json!({
                                            "type":"status",
                                            "uid":uid,
                                            "message_sent":true,
                                            "status":"user online"
                                        })
                                        .to_string();

                                        tx.send(data).unwrap();
                                    }
                                } else {

                                    //If user is offline
                                    //Add to database
                                    let insert_msg =
                                        add_message_to_database(&client, &pk, &user_message, &uid)
                                            .await.unwrap();

                                    let data = json!({
                                        "type":"status",
                                        "uid":uid,
                                        "message_sent":true,
                                        "status":"user offline"
                                    })
                                    .to_string();

                                    tx.send(data).unwrap();
                                }
                            }
                            _ => {}
                        }
                    }
                }
                Message::Ping(msg) => {
                    println!("{:?}", msg);
                }
                Message::Pong(msg) => {
                    println!("{:?}", msg);
                }
                Message::Binary(msg) => {
                    println!("{:?}", msg);
                }
                Message::Close(msg) => {
                    println!("{:?}", msg);
                }
            }
        }

        let mut foo = state.lock().await;

        foo.remove(&pk[..]);
        handler.abort();
        println!("Disconnected");
    });
}

pub async fn add_message_to_database(
    client: &Arc<RwLock<Client>>,
    pk: &str,
    user_message: &UserMessage,
    uid: &str,
) -> Result<u64, Error> {
    let unlock_client = client.read().await;
    let time = SystemTime::now();
    let since_the_epoch = time
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    let insert_message = unlock_client
        .execute(
            "INSERT INTO MESSAGES VALUES($1,$2,$3,$4,$5)",
            &[
                &pk.clone(),
                &user_message.public_key.clone(),
                &"false",
                &uid,
                &"time",
            ],
        )
        .await;
    insert_message
}
