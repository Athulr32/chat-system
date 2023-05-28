

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useWebSocket, { ReadyState } from "react-use-websocket"
import { getCookie } from 'cookies-next';
import SelectContact from '@/components/SelectContact';
import SingleChat from '@/components/SingleChat';
import connectToDB from '@/lib/db';
import HomePage from './HomePage';
import { decrypt } from 'eciesjs';
import { useRouter } from 'next/router';
import { useAllDocs, useFind } from 'use-pouchdb';
import useEventListener from '@/hooks/useEventListener';
import { Message } from '@/pages/chat';

interface check {
    message_type: String
}

type Auth = {
    type: String,
    status: String,
    message: String,
}

export type ServerMessage = {
    uid: string,
    message_type: string,
    cipher: string,
    public_key: string,
    message_id: string,
    name?: string
}


type MessageStatus = {
    message_type: String,
    uid: String,
    status: String,
    message_sent: String,
    key: string,
}

type SendMessage = {
    uid: String,
    message_type: String,
    cipher: String,
    public_key: String,
}


export type StoredMessage = {
    cipher: string,
    rec?: boolean,
    status?: string
    uid: string | null,
}

export type DocumentSchema = {
    id?: string,
    name?: string,
    messages?: StoredMessage[]
    _rev?: string
}


export type OfflineMessages = {
    
    message_type: string,
    status: boolean,
    messages: Message[]
}
function ChatHome() {


    const [test, setTest] = useState(false)
    let db = useMemo(() => { return connectToDB() }, []);

    const [receiverDetails, setReceiverDetails] = useState({
        name: "",
        pubKey: ""
    })

    const [selected, setSelected] = useState(false);
    const [contactSelect, setContactSelect] = useState(false);

    const router = useRouter();

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
        retryOnError: true,
        reconnectAttempts: 10,
    });

    console.log(readyState)

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];



    async function insertIntoDb(messages: ServerMessage) {
        let getKey = getCookie("privKey") as string;
        let decrypt_message: Buffer;

        try {

            decrypt_message = decrypt(getKey, Buffer.from(messages.cipher, "base64"))
        }
        catch (e) {
            decrypt_message = Buffer.from(messages.cipher);
        }

        db.get(messages.public_key, {}).then((e: any) => {

            let messageInDb = e.message as StoredMessage[]
            messageInDb.push({ cipher: decrypt_message.toString(), rec: true, status: "delivered", uid: messages.uid });

            return db.put({
                _id: messages.public_key,
                _rev: e._rev,
                message: messageInDb,
                name: e.name
            }, { force: true, })

        })
            .catch(e => {
                console.log(e)
                db.put({
                    _id: messages.public_key,
                    message: [{ cipher: decrypt_message.toString(), rec: true, status: "delivered", uid: messages.uid }],
                    name: messages.name
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
                    console.log("Hey")
                    setAuth(true)
                    sendMessage(`{"message_type":"get_message"}`)
                }
                else {
                    router.push("/")
                }
            }
            else if (data.message_type == "private_message") {

                let messages: ServerMessage = JSON.parse(lastMessage?.data);

                insertIntoDb(messages)


            }
            else if (data.message_type == "status") {
                let messages: MessageStatus = JSON.parse(lastMessage?.data);

                if (messages.status == "delivered" && messages.message_sent == "true") {
                    let message_uid = messages.uid;
                    db.get(messages.key).then((e: any) => {

                        let messageInDb = e.message as StoredMessage[]

                        for (let i = 0; i < messageInDb.length; i++) {
                            if (messageInDb[i].uid == message_uid) {

                                messageInDb[i].status = "delivered";

                                break
                            }
                        }

                        return db.put({
                            _id: e._id,
                            _rev: e._rev,
                            message: messageInDb,
                            name: e.name
                        }, { force: true, })


                    })


                    //Set the wait to sent in database for this UID
                }
                else if (messages.status == "sent" && messages.message_sent == "true") {
                    let message_uid = messages.uid;
                    db.get(messages.key).then((e: any) => {

                        let messageInDb = e.message as StoredMessage[]

                        for (let i = 0; i < messageInDb.length; i++) {
                            if (messageInDb[i].uid == message_uid) {

                                messageInDb[i].status = "sent";

                                break
                            }
                        }


                        return db.put({
                            _id: e._id,
                            _rev: e._rev,
                            message: messageInDb,
                            name: e.name
                        }, { force: true, })


                    })
                }
            }
            else if (data.message_type == "offline_messages") {

                let { messages, status }: OfflineMessages = JSON.parse(lastMessage?.data)

                if (status) {

                    //insert into db;

                    (async () => {

                        //THe messages can be of different users
                        for (const message of messages as Message[]) {

                            try {
                                let openDb: any = await db.get(message.public_key)
                                let messageInDb = openDb.message as StoredMessage[];
                                console.log(openDb)

                                let getKey = getCookie("privKey") as string;
                                let decrypt_message: Buffer;

                                try {

                                    decrypt_message = decrypt(getKey, Buffer.from(message.cipher, "base64"))
                                }
                                catch (e) {
                                    decrypt_message = Buffer.from(message.cipher);
                                }

                                messageInDb.push({ cipher: decrypt_message.toString(), rec: true, status: "delivered", uid: message.message_id });


                                let notifyServer = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/updateStatus`, {
                                    method: "POST",
                                    headers: {
                                        "AUTHENTICATION": token as string,
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        message_id: message.message_id,
                                        public_key: message.public_key
                                    })
                                })
                                console.log(await notifyServer.text())
                                if (notifyServer.status === 401 || notifyServer.status === 502) {

                                    continue;
                                }

                                var updateDb = await db.put({
                                    _id: openDb._id,
                                    _rev: openDb._rev,
                                    name: openDb.name,
                                    message: messageInDb
                                });

                            }
                            catch (e) {
                                console.log(e)
                                console.log("Failed to insert messages which is not seen by user")
                            }
                        }

                        setTest(true)



                    })()

                }
                else {
                    setTest(true)
                }

                //Update the status of those messages
            }
        }
    }, [lastJsonMessage, connectionStatus]);



    const setSingleChat = async (name: string, pubKey: string) => {

        if (!name || !pubKey) {
            return;
        }

        setReceiverDetails({ name, pubKey })
        setSelected(true);
        setContactSelect(false);

    }


    async function sendMessageWebSocket(message: string) {

        sendMessage(message)
    }


    async function selectHandler(n: boolean) {
        setSelected(n)

    }




    return (
        <div>
            <div onClick={(e) => {
                db.destroy();

            }}>Logut</div>
            {!selected && test && <HomePage setSingleChat={setSingleChat} setContactSelect={setContactSelect} ></HomePage>}

            {selected && !contactSelect && <SingleChat setSelected={selectHandler} name={receiverDetails.name} publicKey={receiverDetails.pubKey} sendMessageWebSocket={sendMessageWebSocket}></SingleChat>}

            {contactSelect && <SelectContact setContactSelect={setContactSelect} selectContact={setSingleChat}></SelectContact>}



        </div>
    )




}

export default ChatHome

