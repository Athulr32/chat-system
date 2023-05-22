// use std::collections::BTreeMap;

// use futures_util::TryStreamExt;
// use axum::{extract::{State}, http::HeaderMap, Json};
// use sha2::Sha256;
// use crate::{websocket::UserMessage, error::Error};

// use hmac::{Hmac, Mac};
// use jwt::VerifyWithKey;


// #[axum_macros::debug_handler]
//  pub async fn get_message(
//     State(db): State<Database>,
//     header: HeaderMap,
// ) -> Result<Json<UserMessage>, Error> {
//     if header.contains_key("AUTHENTICATION") {
//         match header["AUTHENTICATION"].to_str() {
//             Ok(token) => {
//                 let key: Hmac<Sha256> = Hmac::new_from_slice(b"wtsefhkjvsfvshkn").unwrap();

//                 let claims: Result<BTreeMap<String, String>, jwt::Error> =
//                     token.verify_with_key(&key);

//                 if let Ok(claim) = claims {
//                     let pk = &claim["key"];

                    
//                       // let messages = Vec::new();
//                       let msg_collection = db.collection::<UserMessage>("messages");
//                       let pk_arr = serde_json::to_string(&hex::decode(&pk).unwrap()).unwrap();
                    
//                       let filter = doc! {"user_message":{"public_key":pk_arr}};

//                       let mut cursor = msg_collection.find(filter, None).await.unwrap();
//                           println!("{}",pk);
//                       // Iterate over the results of the cursor.
//                       while let Some(message) = cursor.try_next().await.unwrap() {
//                           println!("title: {:?}", message);
//                       }
  






//                     return Ok::<Json<UserMessage>, Error>(Json(
//                         UserMessage::default(),
//                     ));
//                 } else {
//                     return Err::<Json<UserMessage>, Error>(
//                         Error::SomethingElseWentWrong,
//                     );
//                 }
//             }
//             Err(_) => {
//                 return Err(Error::SomethingElseWentWrong);
//             }
//         }
//     }

//     Err(Error::AuthenticationError)
// }
