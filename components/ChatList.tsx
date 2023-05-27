
import Image from "next/image"
import type { DocumentSchema } from "./ChatHome"
import profile from "../public/profile.jpeg";
import { useAllDocs } from "use-pouchdb";
import connectToDB, { getDb } from "@/lib/db";

export default function ChatList({ setContactSelect, setSingleChat }: {setContactSelect: Function, setSingleChat: Function }) {

    let { state, rows } = useAllDocs({ include_docs: true, attachments: true });
    let db = getDb();

    let chats: DocumentSchema[];

    if (state === "done") {

        chats = rows.map((row:any) => {

            let data: DocumentSchema = {
                id: row.doc?._id,
                name: row.doc?.name!,
                _rev: row.doc?._rev,
                messages: row.doc!.message

            }

            return data

        })

        console.log(chats)
    }

    return (

        <>
            <div className=" pt-10">
                <div className="flex justify-between px-3">
                    <div className="text-3xl">
                        Chats
                    </div>
                    <div className='text-right'>
                        <button onClick={(e) => {
                            setContactSelect(true)
                        }} > New Message</button>
                    </div>
                </div>

                <div>
                    {state==="done" && chats!.map((chat, index) => {

                  
                        return (

                            <div key={index} onClick={() => {
                                setSingleChat(chat.name, chat.id)
                            }}>
                                <ChatItem chat={chat}></ChatItem>
                            </div>

                        )
                    })}
                </div>


            </div>
        </>
    )

}



function ChatItem({ chat }: { chat: DocumentSchema }) {


    return (
        <>
            <div className=" border border-stone-50 border-t-stone-50" id={chat.id} title={chat.name}>
                <div className="px-2 flex flex-row py-5 justify-between">
                    <div className="pr-10"><Image width={100} height={100} src={profile} alt="profile"></Image></div>
                    <div className="pl-20">
                        <div>{chat.name}</div>
                        <div className="font-thin break-normal text-sm">{chat.messages?.at(-1)?.cipher}</div>
                    </div>
                    <div className="text-right w-full">
                        time
                    </div>
                </div>
            </div >
        </>
    )


}