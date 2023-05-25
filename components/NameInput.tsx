import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { useRef, useState } from "react";
import { publicKeyCreate, ecdsaSign } from "secp256k1";
import { setCookie } from "cookies-next";

import { useRouter } from "next/navigation"

export default function NameInput(props: any) {

    const router = useRouter();
    const [name, setName] = useState<String>("");

    const [errorFlag, setErrorFlag] = useState(false);
    const [error, setError] = useState("")


    async function userRegistration() {
        const seed = mnemonicToSeedSync(props.mnemonic)

        //Keys  
        const privKeyBytes = new Uint8Array(seed.slice(0, 32));
        const publicKey = publicKeyCreate(privKeyBytes);

        //Message
        const msgBuffer = new TextEncoder().encode("Hello");

        //Hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

        // convert ArrayBuffer to Uint8Array
        const hashArray = new Uint8Array(hashBuffer);


        //ECDSA
        let sign = ecdsaSign(hashArray, privKeyBytes)

        let data = {
            recid: sign.recid,
            signature: [...sign.signature],
            message: "Hello",
            pub_key: [...publicKey],
            name: name
        }

        function toHexString(byteArray: number[]) {
            return Array.from(byteArray, function (byte) {
                return ('0' + (byte & 0xFF).toString(16)).slice(-2);
            }).join('')
        }

        let pubKey = [...publicKey]
        
        setCookie("pubKey", toHexString(pubKey))
        setCookie("privKey", toHexString([...privKeyBytes]))

        const res = await fetch("http://localhost:3011/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        })

        const response = await res.json();
        console.log(res)
        if (res.status == 403) {

            setErrorFlag(true);
            setError(response.message)

        }
        else if (res.status == 200) {
            setErrorFlag(true);
            setError("Successfull");
            setCookie("token", response.token);
            setCookie("name", name);
            router.push("/chat")
        }
        else {
            setErrorFlag(true);
            setError(response.message)
        }






    }


    return (
        <div className="pt-20 px-10">
            <div className="py-3">Enter your name</div>

            <div className="pb-3">
                <input onChange={(e) => {
                    setName(e.currentTarget.value)
                }} className="w-full h-10 text-black p-2" type="text" />
            </div>

            <div className="py-4">
                <button onClick={userRegistration} className="text-white bg-blue-700 p-4 px-1 rounded w-54">Submit</button>
            </div>

            {errorFlag &&
                <div>
                    {error}
                </div>}
        </div>
    )

}