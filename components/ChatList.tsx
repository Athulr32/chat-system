
import type { AllChatsType } from "./ChatHome"

export default function ChatList({allChats,setContactSelect}:{allChats:AllChatsType[],setContactSelect:Function}) {


    return (
        <div>

            <div className="px-4 pt-10">
                <div>

                    Chats
                </div>
                {allChats.map(chat => {
                    return (
                        <div className="flex flex-row pt-10" id={chat.id}>
                            <div className="pr-10">Profile</div>
                            <div>
                                <div>{chat.name}</div>
                                <div>{chat.messages.at(-1)?.cipher}</div>
                            </div>
                            <div className="text-right w-full">
                                time
                            </div>
                        </div>

                    )
                })}

                <div className='text-right absolute bottom-10 right-10'>
                    <button onClick={(e) => {
                        setContactSelect(true)
                    }} > Message Button</button>
                </div>
            </div>

        </div>
    )
}