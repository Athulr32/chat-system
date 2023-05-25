use serde::{Deserialize, Serialize};
//User message
#[derive(Serialize, Deserialize, Clone, Default, Debug)]

pub struct ClientMessage {
    uid: String,
    pub message_type: String,
    cipher: String,
    public_key: String,
}

impl ClientMessage {
    pub fn get_public_key(&self) -> String {
        self.public_key.clone()
    }

    pub fn get_uid(&self) -> String {
        self.uid.clone()
    }

    pub fn get_cipher(&self) -> String {
        self.cipher.clone()
    }
}


#[derive(Serialize, Deserialize, Clone, Default, Debug)]
pub struct RecieverMessage {
    uid: String,
    message_type: String,
    cipher: String,
    public_key: String,
    message_id: String,
    name: String,
}

impl RecieverMessage {
    pub fn build(
        uid: String,
        message_type: String,
        cipher: String,
        public_key: String,
        message_id: String,
        name: String,
    ) -> Self {
        RecieverMessage {
            uid,
            message_type,
            cipher,
            public_key,
            message_id,
            name,
        }
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct MessageStatus {
    message_type: String,
    uid: String,
    status: String,
    message_sent: String,
}

impl MessageStatus {
    pub fn build(message_type: String, uid: String, status: String, message_sent: String) -> Self {
        MessageStatus {
            message_type,
            uid,
            status,
            message_sent,
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct SocketAuth {
    token: String,
}

impl SocketAuth {
    pub fn get_token(&self) -> String {
        self.token.clone()
    }
}
