import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';

import PouchDb from 'pouchdb';
import plugin from 'pouchdb-find';
PouchDb.plugin(plugin)
// const ChatHome = dynamic(() => import('../components/ChatHome').then((module) => module.default), { ssr: false, loading: () => <p>Loading...</p>, });

import ChatHome, { StoredMessage } from '../components/ChatHome';
import { Provider } from 'use-pouchdb';
import connectToDB from '@/lib/db';
import { decrypt } from 'eciesjs';
import { off } from 'process';


export type Message = {
    message_type: string,
    cipher: string,
    public_key: string,
    message_id: string,
    time: string
}




export type NoMessage = {
    status: boolean
}

async function getMsg(tok: any, db: PouchDB.Database) {


    const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}getMessage`, {
        headers: {
            "AUTHENTICATION": tok as string
        }
    })

    const messages = await (req).json()
    console.log(messages)
    if (messages.status === false) {
        return;
    }

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
                    "AUTHENTICATION": tok as string,
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


    // for (const msg of messages) {
    //     console.log(msg)
    //     db.get(msg.public_key).then(e => {
    //         console.log(msg.public_key)
    //         let messageInDb = e.message as StoredMessage[]
    //         let getKey = getCookie("privKey") as string;
    //         let decrypt_message: Buffer;

    //         try {

    //             decrypt_message = decrypt(getKey, Buffer.from(msg.cipher, "base64"))
    //         }
    //         catch (e) {
    //             decrypt_message = Buffer.from(msg.cipher);
    //         }

    //         messageInDb.push({ cipher: decrypt_message.toString(), rec: true, status: "delivered", uid: msg.message_id });
    //         let uniq = [...new Set(messageInDb)];
    //         console.log(...new Set(messageInDb))
    //         console.log(uniq)
    //         return db.put({
    //             _id: e._id,
    //             _rev: e._rev,
    //             message: uniq,
    //             name: e.name,

    //         }, { force: true }).catch(e => {
    //             console.log(e)
    //         })


    //     }).then(e => {
    //         //Send the status
    //     })
    //         .catch(e => {
    //             console.log(e)
    //             db.put({
    //                 _id: msg.public_key,
    //                 message: [{ cipher: msg.cipher, rec: true, status: "delivered", uid: msg.message_id }],
    //                 name: name
    //             }, { force: true }).then(e => {

    //                 //Send the status
    //             })
    //                 .catch(e => {
    //                     console.log(e)
    //                 })
    //         })


    // }

    //Update messages in db

}




export default function Chat() {

    let db = connectToDB();
    let router = useRouter()

    useEffect(() => {
        let tok = getCookie("token")

        if (!tok) {
            router.push("/")
        }
        console.log("Hi")

        getMsg(tok, db)
    }, [])


    return (
        <div style={{ height: "100%", color: "white" }}>

            <Provider pouchdb={db}>
                <ChatHome></ChatHome>
            </Provider>



        </div>
    )

}