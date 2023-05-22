import { useEffect, useState } from "react"
import { StoredMessageType } from "./ChatHome"
import { encrypt, decrypt, PrivateKey } from 'eciesjs'
import connectToDB from '@/lib/db';
type Chat = {
    publicKey: string,
    name: string,
    chats: StoredMessageType[],
    sendMessageWebSocket: Function
}


type ClientMessage = {
    uid: string,
    message_type: string,
    cipher: string,
    public_key: string,
}

export default function SingleChat({ publicKey, name, chats, sendMessageWebSocket }: Chat) {

    const [inputMessage, setInputMessage] = useState<string | null>(null)


    async function sendSocketMessage() {

        if (inputMessage == null) {
            return;
        }
        else {
            let messageInBuffer = Buffer.from(inputMessage);
            console.log(messageInBuffer)
            let encryptedData = encrypt(publicKey, messageInBuffer);
            console.log(encryptedData)
            var id = "id" + Math.random().toString(16).slice(2)
            console.log(id)
            let db = connectToDB();

            let message: ClientMessage = {
                cipher: encryptedData.toString("base64"),
                message_type: "private_message",
                uid: id,
                public_key: publicKey
            }

            db.get(publicKey, {}).then((e: any) => {

                let messageInDb = e.message as StoredMessageType[]

                messageInDb.push({ cipher: inputMessage, rec: true, status: "wait" });

                return db.put({
                    _id: publicKey,
                    _rev: e._rev,
                    message: messageInDb,
                    name: e.name
                })

            })
                .catch(e => {
                    console.log(e)
                    db.put({
                        _id: publicKey,
                        message: [{ cipher: inputMessage, rec: true, status: "wait" }],
                        name: name
                    })
                })

            sendMessageWebSocket(JSON.stringify(message))

        }


    }



    useEffect(() => {

        //Fetch all messages in this publicKey
    }, [])


    return (
        <div className="px-10 py-10 overflow-y-scroll">
            <div className="fixed border-8 border-black bottom-0">
                <input type="text" onChange={e => {
                    setInputMessage(e.currentTarget.value)
                }}
                />
                <button onClick={sendSocketMessage}>Send</button>
            </div>
            <div>Go back</div>
            <div >{

                chats.map((chat: StoredMessageType) => {
                    return (
                        <div>
                            {chat.cipher}
                        </div>
                    )
                })

            }</div>



        </div>
    )

}