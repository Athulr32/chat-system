

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getCookie } from 'cookies-next';
import SelectContact from '@/components/SelectContact';
import SingleChat from '@/components/SingleChat';
import connectToDB from '@/lib/db';
import HomePage from './HomePage';
import { decrypt } from 'eciesjs';
import { useRouter } from 'next/router';
import { useAllDocs, useFind } from 'use-pouchdb';
import useEventListener from '@/hooks/useEventListener';

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


export type StoredMessage = {
    cipher: string,
    rec?: boolean,
    status?: string
}

export type DocumentSchema = {
    id?: string,
    name?: string,
    messages?: StoredMessage[]
    _rev?: string
}


function ChatHome() {

    let db = useMemo(() => { return connectToDB() }, []);

    let d = useEventListener(db)

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

    } = useWebSocket(`ws://localhost:3011/ws`, {
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

            let messageInDb = e.message as StoredMessage[]


            messageInDb.push({ cipher: decrypt_message.toString(), rec: true, status: "received" });

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
                    message: [{ cipher: decrypt_message.toString(), rec: true, status: "received" }],
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

            {!selected && <HomePage setSingleChat={setSingleChat} setContactSelect={setContactSelect} ></HomePage>}

            {selected && !contactSelect && <SingleChat setSelected={selectHandler} name={receiverDetails.name} publicKey={receiverDetails.pubKey} sendMessageWebSocket={sendMessageWebSocket}></SingleChat>}

            {contactSelect && <SelectContact setContactSelect={setContactSelect} selectContact={setSingleChat}></SelectContact>}



        </div>
    )




}

export default ChatHome

