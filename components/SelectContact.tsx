import { getCookie } from "cookies-next"
import { memo, useMemo, useRef, useState } from "react"



function SelectContact(props: any) {

    const [name, setName] = useState("")
    const [pubKey, setPubKey] = useState("")
    async function searchHandler() {
        try {


            let token: string = getCookie("token") as string;


            const res = await fetch("http://localhost:3011/userSearch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*',
                    'AUTHENTICATION': token
                },
                body: JSON.stringify({
                    param: name,
                    is_name: true
                })
            })

            let pubKey = await res.json();
            if (pubKey?.message) {
                return;
            }
            props.selectContact(name, pubKey)
        }
        catch (e) {
            console.log("No user");
        }


    }


    return (
        <div className="absolute top-20">
            <div className="px-20">
                <input onChange={(e) => {
                    setName(e.currentTarget.value)
                }} type="text" placeholder="Enter Name or public key" className="border-black border-4" />
            </div>
            <div className="text-center">
                <button onClick={searchHandler}>submit</button>
            </div>
        </div>
    )



}

export default SelectContact