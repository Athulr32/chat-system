
import Image from "next/image"
import type { AllChatsType } from "./ChatHome"
import profile from "../public/profile.jpeg";

export default function ChatList({ allChats, setContactSelect, setSingleChat }: { allChats: AllChatsType[], setContactSelect: Function, setSingleChat: Function }) {


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
                    {allChats.map((chat, index) => {
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



function ChatItem({ chat }: { chat: AllChatsType }) {


    return (
        <>
            <div className=" border border-stone-50 border-t-stone-50" id={chat.id} title={chat.name}>
                <div className="px-2 flex flex-row py-5 justify-between">
                    <div className="pr-10"><Image width={100} height={100} src={profile} alt="profile"></Image></div>
                    <div className="pl-20">
                        <div>{chat.name}</div>
                        <div className="font-thin break-normal text-sm">{chat.messages.cipher}</div>
                    </div>
                    <div className="text-right w-full">
                        time
                    </div>
                </div>
            </div >
        </>
    )


}