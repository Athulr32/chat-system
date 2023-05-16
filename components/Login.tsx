
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { useRef, useState } from "react";
import { publicKeyCreate, ecdsaSign } from "secp256k1";
import { setCookie } from "cookies-next";
import NameInput from "./NameInput";

export default function Login() {


    const [mnemonic,setMenomonic] = useState<string>("");
    const [nameNeeded,setNameNeeded] = useState<boolean>(false)

    async function loginHandler(){

        if(mnemonic.split(" ").length <12){
            return ;
        }

        const seed = mnemonicToSeedSync(mnemonic)
        console.log(seed)
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
         
        }

        console.log(data)
        const res = await fetch("http://localhost:3011/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        })

        const response = await res.json();
        console.log(res)
        console.log(response)

        if(res.status == 401){

            setNameNeeded(true);

        }


    }

    return (
        <div>
           {!nameNeeded && <div className="p-10 text-center pt-40">

                    <div className="bg-gray-600 p-8 rounded mb-10">
                        Enter Your Secret Phrase
                    </div>

                    <div className="bg-gray-600 p-2 rounded mb-10">

                        <textarea onChange={(e)=>{
                            setMenomonic(e.currentTarget.value)
                            console.log(mnemonic)
                        }}  className="bg-gray-600 h-40 w-full resize-none active:outline-transparent focus:outline-0" />

                    </div>

                    <div className="">
                        <button onClick={loginHandler} className="bg-blue-700 p-4 px-1 rounded w-54">Import</button>
                    </div>

            </div>}

            {nameNeeded && <NameInput mnemonic={mnemonic}></NameInput>}


        </div>
    )
}