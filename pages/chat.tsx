import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';

const ChatHome = dynamic(() => import('../components/ChatHome').then((module) => module.default), { ssr: false, loading: () => <p>Loading...</p>, });


export default function Chat() {

    let router = useRouter()


    useEffect(() => {
        let tok = getCookie("token")

        if (!tok) {
            router.push("/")
        }
        console.log("Hi")
    }, [])


    return (
        <div style={{ height: "100%", color: "white" }}>
            <ChatHome></ChatHome>
        </div>
    )

}