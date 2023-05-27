import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getCookie } from 'cookies-next';

import PouchDb from 'pouchdb';
import plugin from 'pouchdb-find';
PouchDb.plugin(plugin)
// const ChatHome = dynamic(() => import('../components/ChatHome').then((module) => module.default), { ssr: false, loading: () => <p>Loading...</p>, });

import ChatHome from '../components/ChatHome';
import { Provider } from 'use-pouchdb';
import connectToDB from '@/lib/db';

export default function Chat() {

    let db = connectToDB();
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

            <Provider pouchdb={db}>
                <ChatHome></ChatHome>
            </Provider>



        </div>
    )

}