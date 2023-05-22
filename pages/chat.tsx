import React from 'react';
import dynamic from 'next/dynamic';

const ChatHome = dynamic(() => import('../components/ChatHome'), { ssr: false, loading: () => <p>Loading...</p>, });


export default function Chat() {

    return (
        <div>
            <div>Hello</div>
            <ChatHome></ChatHome>
        </div>
    )

}