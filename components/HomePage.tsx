
import { useState } from "react";
import BottomBar from "./BottomBar"
import type { DocumentSchema } from "./ChatHome"
import ChatList from "./ChatList"
import Profile from "./Profile"
import { useAllDocs } from "use-pouchdb";

export default function HomePage({ setContactSelect, setSingleChat }: { setContactSelect: Function, setSingleChat: Function }) {

   
    const [trackPage, setTrackPage] = useState<number>(1);

    function trackPageHandler(page: number) {

        setTrackPage(page);
    }


    let render = <ChatList setSingleChat={setSingleChat} setContactSelect={setContactSelect}></ChatList>

    if (trackPage === 1) {

        {/*User Chat Home screen*/ }
        render = <ChatList setSingleChat={setSingleChat} setContactSelect={setContactSelect}></ChatList>

    }
    else if (trackPage === 2) {

        {/* User profile */ }
        render = <Profile></Profile>
    }
    else {
        console.log("its is", trackPage)
        render = <div>Hu</div>
    }


    return (
        <div>
            {render}

            {/* Bottom Bar */}
            <BottomBar trackPageFunction={trackPageHandler}></BottomBar>
        </div>
    )
}