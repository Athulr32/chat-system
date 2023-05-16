import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/router';


interface check {
    type: String
}

type Auth = {
    type: String,
    status: String,
    message: String,
}

export default function Chat() {

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
    } = useWebSocket("ws://127.0.0.1:3011/ws", {
        onOpen: (e) => sendMessage(`{"token":"${token}"}`),
        //Will attempt to reconnect on all close events, such as server shutting down
        shouldReconnect: (closeEvent) => true,
        onClose: () => console.log("closing"),
        reconnectAttempts: 10,
    });


    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];


    useEffect(() => {

        if (lastJsonMessage !== null && connectionStatus == "Open") {
            let data: check = JSON.parse(lastMessage?.data);

            if (data.type == "authentication") {
                let authDetails: Auth = JSON.parse(lastMessage?.data);
                if (authDetails.status == "true") {
                    setAuth(true)
                }
                else{
                    router.push("/")
                }
            }
            // else if(data.)
        }
    }, [lastJsonMessage, connectionStatus]);





    return (
        <div>

            <div className="px-4 pt-10">

                <div>

                    Chats
                </div>

                <div className="flex flex-row pt-10">
                    <div className="pr-10">Profile</div>
                    <div>
                        <div>Name</div>
                        <div>Message</div>
                    </div>
                    <div className="text-right w-full">
                        time
                    </div>
                </div>

                <div className="flex flex-row pt-10">
                    <div className="pr-10">Profile</div>
                    <div>
                        <div>Name</div>
                        <div>Message</div>
                    </div>
                    <div className="text-right w-full">
                        time
                    </div>
                </div>

            </div>



        </div>
    )




}