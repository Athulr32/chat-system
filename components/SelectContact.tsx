import { getCookie } from "cookies-next"
import { memo, useMemo, useRef, useState } from "react"



function SelectContact(props: any) {

    const [name, setName] = useState("")
    const [pubKey, setPubKey] = useState("")
    async function searchHandler() {
        try {


            let token: string = getCookie("token") as string;


            const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/userSearch`, {
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
            props.selectContact(name, pubKey);
            props.setContactSelect(false);
        }
        catch (e) {
            console.log("No user");
        }


    }


    return (
        <div className="absolute top-20 " style={{ backgroundColor:"black",height:"80%",width:"100%" }}>
            <div className="pl-10 pt-5" onClick={()=>{
                  props.setContactSelect(false);
            }}>Back</div>
            <div className="px-20 pt-20">
                <input onChange={(e) => {
                    setName(e.currentTarget.value)
                }} type="text" placeholder="Enter Name or public key" className="border-black border-4 px-5 py-2  text-black" />
            </div>
            <div className="text-center pt-10 ">
                <button className="bg-purple-800 p-2 rounded" onClick={searchHandler}>submit</button>
            </div>
        </div>
    )



}

export default SelectContact