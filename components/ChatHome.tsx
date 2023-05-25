

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getCookie } from 'cookies-next';
import SelectContact from '@/components/SelectContact';
import SingleChat from '@/components/SingleChat';
import connectToDB from '@/lib/db';
import HomePage from './HomePage';
import { decrypt } from 'eciesjs';
import { useRouter } from 'next/router';
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
    rec?: boolean,
    status?: string
}

export type AllChatsType = {
    id: string,
    name: string,
    messages: StoredMessageType

}


function ChatHome() {

    let db = useMemo(() => { return connectToDB() }, []);

    const [name, setName] = useState("");
    const [pubKey, setPubKey] = useState("")
    const [selected, setSelected] = useState(false);
    const [contactSelect, setContactSelect] = useState(false);

    const [allChats, setAllChats] = useState<AllChatsType[]>([{ id: "", name: "", messages: { cipher: "", rec: false, status: "" } }])

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
    } = useWebSocket(`${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws`, {
        onOpen: (e) => {
            sendMessage(`{"token":"${token}"}`);
            console.log("Connected")
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
                    messages: doc.doc.message.at(-1),
                    name: doc.doc.name
                }
            })
            console.log(allDocs)
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



    async function insertIntoDb(messages: UserMessage) {
        let getKey = getCookie("privKey") as string;
        let decrypt_message: Buffer;

        try {

            decrypt_message = decrypt(getKey, Buffer.from(messages.cipher, "base64"))
        }
        catch (e) {
            decrypt_message = Buffer.from(messages.cipher);
        }

        db.get(messages.public_key, {}).then((e: any) => {

            let messageInDb = e.message as StoredMessageType[]


            messageInDb.push({ cipher: decrypt_message.toString(), rec: true, status: "received" });

            return db.put({
                _id: messages.public_key,
                _rev: e._rev,
                message: messageInDb,
                name: e.name
            }, { force: true, })

        }).then(e => {

            //Update the state after inserting data into database

            db.allDocs({ include_docs: true }).then(e => {
                let docs = e.rows;
                let allDocs = docs.map((doc) => {
                    return {
                        id: doc.id,
                        messages: doc.doc.message.at(-1),
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
            .catch(e => {
                console.log(e)
                db.put({
                    _id: messages.public_key,
                    message: [{ cipher: decrypt_message.toString(), rec: true, status: "received" }],
                    name: messages.name
                })
                    .then(e => {

                        db.allDocs({ include_docs: true }).then(e => {
                            let docs = e.rows;
                            let allDocs = docs.map((doc) => {
                                return {
                                    id: doc.id,
                                    messages: doc.doc.message.at(-1),
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
                    .catch(e => {
                        console.log(e)
                    })




            })
    }



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

                insertIntoDb(messages)


            }
            else if (data.message_type == "status") {
                let messages: MessageStatus = JSON.parse(lastMessage?.data);

                if (messages.status == "user_online" && messages.message_sent == "true") {

                    //Send the wait to sent in database for this UID
                }
            }
        }
    }, [lastJsonMessage, connectionStatus]);



    const setSingleChat = async (name: string, pubKey: string) => {

        setSingleChatMessages([])
        try {

            setName(name);
            setPubKey(pubKey);
            let doc = await db.get(pubKey);
            setSingleChatMessages(doc.message)

            setSelected(true)
            setContactSelect(false)

        }
        catch (e) {

            setSelected(true)
            setContactSelect(false)
            console.log(e)


        }




    }


    async function sendMessageWebSocket(message: string) {

        sendMessage(message)
    }


    async function selectHandler(n: boolean) {
        setSelected(n)

    }


    async function setFullChat(chats: AllChatsType[]) {
        setAllChats(chats)

        if (selected) {

            db.get(pubKey).then(doc => {

                setSingleChatMessages(doc.message)
            }).catch(e => {
                console.log(e)
                setSingleChatMessages([])
            })

        }

    }


    async function singleChatStateHandler() {



    }

    return (
        <div>

            {!selected && <HomePage setSingleChat={setSingleChat} allChats={allChats} setContactSelect={setContactSelect} ></HomePage>}

            {selected && !contactSelect && <SingleChat setFullChat={setFullChat} setSelected={selectHandler} name={name} publicKey={pubKey} chats={singleChatMessages} sendMessageWebSocket={sendMessageWebSocket} ></SingleChat>}

            {contactSelect && <SelectContact setContactSelect={setContactSelect} selectContact={setSingleChat}></SelectContact>}



        </div>
    )




}

export default ChatHome

