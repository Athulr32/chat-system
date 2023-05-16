import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { useRef, useState } from "react";

import NameInput from "./NameInput";

export default function SignIn() {

    const [nameFlag, setNameFlag] = useState<boolean>(false);

    const mnemonic: string = generateMnemonic();
    const mnemonicArray: string[] = mnemonic.split(" ");

    return (
        <div className="bg-gray-800 h-screen text-white">

            {!nameFlag && <div className="px-6 pt-20 text-center ">
                <div className="mx-2">
                    <div className="flex flex-col">
                        <div className="flex flex-row justify-between m-3">
                            <div> 1. {mnemonicArray[0]} </div>
                            <div> 2. {mnemonicArray[1]} </div>
                        </div>

                        <div className="flex flex-row justify-between m-3">
                            <div> 3. {mnemonicArray[2]} </div>
                            <div> 4. {mnemonicArray[3]} </div>
                        </div>

                        <div className="flex flex-row justify-between m-3">
                            <div> 5. {mnemonicArray[4]} </div>
                            <div> 6. {mnemonicArray[5]} </div>
                        </div>

                        <div className="flex flex-row justify-between m-3">
                            <div> 7. {mnemonicArray[6]} </div>
                            <div> 8. {mnemonicArray[7]} </div>
                        </div>

                        <div className="flex flex-row justify-between m-3">
                            <div> 9. {mnemonicArray[8]} </div>
                            <div> 10. {mnemonicArray[9]} </div>
                        </div>

                        <div className="flex flex-row justify-between m-3">
                            <div> 11. {mnemonicArray[10]} </div>
                            <div> 12. {mnemonicArray[11]} </div>
                        </div>

                    </div>
                </div>

                <div className="pt-40 pb-20">This is your secret phrase Store it!</div>
                <div>
                    <button onClick={() => {
                        setNameFlag(true)
                    }} className="text-white bg-blue-700 p-4 px-1 rounded w-54">Continue</button>
                </div>
            </div>}

            {nameFlag && <NameInput mnemonic={mnemonic}></NameInput>}


        </div>
    )

}


