import { useEffect, useState } from "react"
import { DocumentSchema, StoredMessage } from "./ChatHome"
import { encrypt, decrypt, PrivateKey } from 'eciesjs'
import connectToDB, { getDb } from '@/lib/db';
import { useDoc } from "use-pouchdb";
type Chat = {
    publicKey: string,
    name: string,
    sendMessageWebSocket: Function,
    setSelected: Function,
}


type ClientMessage = {
    uid: string,
    message_type: string,
    cipher: string,
    public_key: string,

}


type Doc = {
    _id?: string,
    name: string,
    message: StoredMessage[]
}

export default function SingleChat({ publicKey, name, sendMessageWebSocket, setSelected }: Chat) {

    const [inputMessage, setInputMessage] = useState<string>("")
    const { doc, loading, state, error } = useDoc(publicKey);

    if (state == "done") {
   
        let messages: StoredMessage[] = doc?.message as StoredMessage[]

        let msgToUpdated = messages.filter(msg => {
            if (msg.rec == true && msg.status == "delivered") {

                return msg
            }
        }).map(msg => {
            return {
                uid: msg.uid,
                pub_key: doc?._id
            }
        })

    }



    let db = getDb();

    // let d = db.find({ selector: { _id: publicKey }, fields: [``] }).then(e => console.log(e))
    //console.log(d)

    let chat = doc as Doc | null;


    async function sendSocketMessage(e) {

        e.preventDefault();
        if (!inputMessage) {
            return;
        }
        else {
            let messageInBuffer = Buffer.from(inputMessage);
          
            let encryptedData = encrypt(publicKey, messageInBuffer);
       
            var id = "id" + Math.random().toString(16).slice(2)
     
            let db = connectToDB();

            let message: ClientMessage = {
                cipher: encryptedData.toString("base64"),
                message_type: "private_message",
                uid: id,
                public_key: publicKey
            }

            db.get(publicKey).then((e:any) => {

                let messageInDb = e.message as StoredMessage[]

                messageInDb.push({ cipher: inputMessage, rec: false, status: "wait", uid: id });

                return db.put({
                    _id: e._id,
                    _rev: e._rev,
                    message: messageInDb,
                    name: e.name,

                }, { force: true }).catch(e => {
                    console.log(e)
                })

            }).then(e => {

                sendMessageWebSocket(JSON.stringify(message))

                db.allDocs({ include_docs: true }).then(e => {
                    let docs = e.rows;
                    let allDocs: DocumentSchema[] = docs.map((doc) => {
                        return {
                            id: doc.id,
                            messages: doc.doc?.message.at(-1),
                            name: doc.doc!.name
                        }
                    })



                }).catch(e => {

                })

            })
                .catch(e => {
                    console.log(e)
                    db.put({
                        _id: publicKey,
                        message: [{ cipher: inputMessage, rec: false, status: "wait", uid: id }],
                        name: name
                    }).then(e => {
                        sendMessageWebSocket(JSON.stringify(message))
                    })
                        .catch(e => {
                            console.log(e)
                        })
                })


            // setInputMessage("")
        }


    }



    if (loading) {

        return <div>Loading</div>
    }

    return (
        <div className="px-0 py-10 break-all">

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
            <div className="overflow-auto px-2 " style={{ maxHeight: "85vh" }}>{

                chat?.message.map((chat: StoredMessage, index) => {
                    return (
                        <div className="m-2 " key={index}>
                            {chat.rec ? <div className="text-left rounded bg-blue-700 inline-block px-5 py-2">{chat.cipher}</div> : <div className="text-right"><div className="text-right bg-blue-950 inline-block px-5 py-2">{chat.cipher}<span> {chat.status}</span></div></div>}
                        </div>
                    )
                })

            }</div>



        </div>
    )

}