import { ServerMessage, StoredMessage } from "@/components/ChatHome";
import { getCookie } from "cookies-next";
import { decrypt } from "eciesjs";
import { getDb } from "./db";

export async function insertServerMessage(messages: ServerMessage) {


    let db = getDb();

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
