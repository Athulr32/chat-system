

import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';
import SelectContact from '@/components/SelectContact';
import SingleChat from '@/components/SingleChat';
import connectToDB from '@/lib/db';
import ChatList from './ChatList';

interface check {
    message_type: String
}

type Auth = {
    type: String,
    status: String,
    message: String,
}

type UserMessage = {
    uid: string,
    message_type: string,
    cipher: string,
    public_key: string,
    message_id: string,
    name: string
}


type MessageStatus = {
    message_type: String,
    uid: String,
    status: String,
    message_sent: String,
}

type SendMessage = {
    uid: String,
    message_type: String,
    cipher: String,
    public_key: String,
}


export type StoredMessageType = {
    cipher: string,
    rec: boolean,
    status: string
}

export type AllChatsType = {
    id: string,
    name: string,
    messages: StoredMessageType[]

}
function ChatHome() {

    let db = connectToDB();
    const [name, setName] = useState("");
    const [pubKey, setPubKey] = useState("")
    const [selected, setSelected] = useState(false);
    const [contactSelect, setContactSelect] = useState(false);

    const [allChats, setAllChats] = useState<AllChatsType[]>([{ id: "", name: "", messages: [{ cipher: "", rec: false, status: "" }] }])

    const [singleChatMessages, setSingleChatMessages] = useState<StoredMessageType[]>([{ cipher: "", rec: false, status: "" }]);

    const router = useRouter();
    const [inital, setInitial] = useState(true);
    const token = getCookie('token');
    const [auth, setAuth] = useState<boolean>(false)
    const {
        sendMessage,
        sendJsonMessage,
        lastMessage,
        lastJsonMessage,
        readyState,
        getWebSocket,
    } = useWebSocket("ws://127.0.0.1:3011/ws", {
        onOpen: (e) => {
            sendMessage(`{"token":"${token}"}`);
        },
        //Will attempt to reconnect on all close events, such as server shutting down
        shouldReconnect: (closeEvent) => true,
        onClose: () => console.log("closing"),
        reconnectAttempts: 10,
    });

    if (inital) {
        db.allDocs({ include_docs: true }).then(e => {
            let docs = e.rows;
            let allDocs = docs.map((doc) => {
                return {
                    id: doc.id,
                    messages: doc.doc.message,
                    name: doc.doc.name
                }
            })

            setAllChats(allDocs)
            setInitial(false);
        }).catch(e => {

        })

    }
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];


    db.changes({
        since: "now",
        live: true,
        include_docs: true,

    }).on('change', function (change) {


        db.allDocs({ include_docs: true }).then(e => {
            let docs = e.rows;
            let allDocs = docs.map((doc) => {
                return {
                    id: doc.id,
                    messages: doc.doc.message,
                    name: doc.doc.name
                }
            })

            setAllChats(allDocs);

            if (selected) {
              
                db.get(pubKey).then(doc => {

                    setSingleChatMessages(doc.message)
                }).catch(e => {
                    console.log(e)
                    setSingleChatMessages([])
                })

            }


        }).catch(e => {

        })


    })

    useEffect(() => {


        if (lastJsonMessage !== null && connectionStatus == "Open") {

            let data: check = JSON.parse(lastMessage?.data);
            console.log(data)
            if (data.message_type == "authentication") {
                let authDetails: Auth = JSON.parse(lastMessage?.data);
                if (authDetails.status == "true") {
                    setAuth(true)
                }
                else {
                    router.push("/")
                }
            }
            else if (data.message_type == "private_message") {
                console.log("Message")
                let messages: UserMessage = JSON.parse(lastMessage?.data);

                db.get(messages.public_key, {}).then((e: any) => {

                    let messageInDb = e.message as StoredMessageType[]

                    messageInDb.push({ cipher: messages.cipher, rec: true, status: "received" });

                    return db.put({
                        _id: messages.public_key,
                        _rev: e._rev,
                        message: messageInDb,
                        name: e.name
                    })

                }).then(e => {

                })
                    .catch(e => {
                        console.log(e)
                        db.put({
                            _id: messages.public_key,
                            message: [{ cipher: messages.cipher, rec: true, status: "received" }],
                            name: messages.name
                        })
                    })
            }
            else if (data.message_type == "status") {
                let messages: MessageStatus = JSON.parse(lastMessage?.data);
                console.log(messages)
            }
        }
    }, [lastJsonMessage, connectionStatus]);



    const setSingleChat = (name: string, pubKey: string) => {

        db.get(pubKey).then(doc => {
            setSingleChatMessages(doc.message)

            setName(name);
            setPubKey(pubKey);

            setSelected(true)
            setContactSelect(false)
        })
            .catch(e => {
                setSingleChatMessages([])
                console.log(e)
            })



    }


    async function sendMessageWebSocket(message: string) {

        sendMessage(message)
    }


    return (
        <div>

            {!selected && <ChatList allChats={allChats} setContactSelect={setContactSelect} ></ChatList>}

            {selected && !contactSelect && <SingleChat name={name} publicKey={pubKey} chats={singleChatMessages} sendMessageWebSocket={sendMessageWebSocket} ></SingleChat>}

            {contactSelect && <SelectContact selectContact={setSingleChat}></SelectContact>}



        </div>
    )




}

export default ChatHome

