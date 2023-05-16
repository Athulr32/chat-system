use axum::{
    routing::{get, post},
    Extension, Router,
};
use chat_server::get_message::get_message;
use chat_server::login::login;
use chat_server::register::register;
use chat_server::websocket::ws_handler;
use futures_util::lock::Mutex;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::broadcast;
use tokio::sync::RwLock;
use tokio_postgres::{Error, NoTls};
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);

    let state: Arc<Mutex<HashMap<String, broadcast::Sender<String>>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let (client, connection) =
        tokio_postgres::connect("host=localhost user=postgres dbname=chatApp", NoTls)
            .await
            .unwrap();

    let new_client = Arc::new(RwLock::new(client));

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    //Creating user table
    let client = new_client.read().await;
    let create_user_table = client
        .execute(
            "CREATE TABLE IF NOT EXISTS USERS(name TEXT UNIQUE ,publicKey TEXT PRIMARY KEY )",
            &[],
        )
        .await
        .unwrap();

    //Creating Message Table
    let create_message_table = client
        .execute(
            "CREATE TABLE IF NOT EXISTS MESSAGES(messageFrom TEXT,messageTo TEXT,seen TEXT,uid TEXT,timestamp TEXT,FOREIGN KEY(messageFrom) REFERENCES USERS(publicKey))",
            &[],
        )
        .await
        .unwrap();

    let insert = client
        .query("SELECT * FROM MESSAGES WHERE messageTo=$1", &[&"key2"])
        .await
        .unwrap();

    // drop(client);

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/login", post(login))
        // .route("/getMessage", get(get_message))
        .route("/register", post(register))
        .layer(Extension(state))
        .layer(cors)
        .with_state(new_client.clone());

    axum::Server::bind(&"127.0.0.1:3011".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}