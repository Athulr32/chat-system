use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};

pub enum Error {
    AuthenticationError,
    WrongDigitalSignature,
    SomethingElseWentWrong,
    DbError,
    UserNameAlreadyExist,
    UserAlreadyExist
}

impl IntoResponse for Error {

    fn into_response(self) -> Response {
        match self {
            Error::AuthenticationError => (
                StatusCode::UNAUTHORIZED,
                r#"{
            "message":"User Not Exist"
        }"#,
            )
                .into_response(),
            Error::SomethingElseWentWrong => (
                StatusCode::BAD_GATEWAY,
                r#"{
                "message":"Something Went Wrong"
            }"#,
            )
                .into_response(),
            Error::WrongDigitalSignature => (
                StatusCode::UNAUTHORIZED,
                r#"{
                "message":"Wrong Digital Signature"
            }"#,
            )
                .into_response(),
            Error::DbError =>(
                StatusCode::BAD_GATEWAY,
                r#"{
                    "message":"Database Error"
                }"#
            ).into_response(),
            Error::UserNameAlreadyExist => (
                StatusCode::FORBIDDEN,
                r#"{
                    "message":"User Name Already Exist."
                }"#
            ).into_response(),
            Error::UserAlreadyExist=>(
                StatusCode::FORBIDDEN,
                r#"{
                    "message":"User Already Exist.Try with different Key."
                }"#
            ).into_response()

        
        }
    }
}
