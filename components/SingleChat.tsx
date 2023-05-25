import { useEffect, useState } from "react"
import { StoredMessageType } from "./ChatHome"
import { encrypt, decrypt, PrivateKey } from 'eciesjs'
import connectToDB from '@/lib/db';
type Chat = {
    publicKey: string,
    name: string,
    chats: StoredMessageType[],
    sendMessageWebSocket: Function,
    setSelected: Function
}


type ClientMessage = {
    uid: string,
    message_type: string,
    cipher: string,
    public_key: string,

}

export default function SingleChat({ publicKey, name, chats, sendMessageWebSocket, setSelected }: Chat) {

    const [inputMessage, setInputMessage] = useState<string>("")


    async function sendSocketMessage(e) {

        e.preventDefault();
        if (!inputMessage) {
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

            db.get(publicKey).then((e) => {

                let messageInDb = e.message as StoredMessageType[]

                messageInDb.push({ cipher: inputMessage, rec: false, status: "wait" });

                return db.put({
                    _id: publicKey,
                    _rev: e._rev,
                    message: messageInDb,
                    name: e.name,

                }, { force: true }).catch(e => {
                    console.log(e)
                })

            }).then(e => {
                console.log(e)
                sendMessageWebSocket(JSON.stringify(message))
            })
                .catch(e => {
                    console.log(e)
                    db.put({
                        _id: publicKey,
                        message: [{ cipher: inputMessage, rec: false, status: "wait" }],
                        name: name
                    }).then(e => {
                        sendMessageWebSocket(JSON.stringify(message))
                    })
                        .catch(e => {
                            console.log(e)
                        })
                })


                setInputMessage("")
        }


    }



    useEffect(() => {

        //Fetch all messages in this publicKey
    }, [])


    return (
        <div className="px-10 py-10 overflow-y-scroll overflow-x-hidden break-all">
 
            <div className="fixed left-0 p-4 bottom-0 w-full flex">
                <input value={inputMessage} type="text" className="w-9/12 text-black" onChange={e => {
                    setInputMessage(e.currentTarget.value)
                }}
                />
                <div className="pl-4">
                    <button className="bg-blue-700 rounded px-4" onClick={sendSocketMessage}>Send</button>
                </div>
            </div>
            <div onClick={() => {
                setSelected(false)
            }}>Go back</div>

            <div className="text-center border-b-2 border-indigo-50">
                {name}
            </div>
            <div >{

                chats.map((chat: StoredMessageType) => {
                    return (
                        <div className="m-2">
                            {chat.rec ? <div className="text-left rounded bg-blue-700 inline-block px-5 py-2">{chat.cipher}</div> : <div className="text-right"><div className="text-right bg-blue-950 inline-block px-5 py-2">{chat.cipher}</div></div>}
                        </div>
                    )
                })

            }</div>



        </div>
    )

}