import { useEffect, useState } from "react"


export default function useEventListener(db: PouchDB.Database) {
    const [state, setState] = useState("online")

    useEffect(() => {


        window.addEventListener("online", () => {
            console.log("Online");
            setState("online")
        })

        window.addEventListener("offline", () => {
            console.log("Offline");
            setState("offline")
        })

    })


}