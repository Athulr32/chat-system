import { ReactComponentElement, useState } from "react";
import Register from "./Register";
import SignIn from "./SignIn";
import Login from "./Login";

export default function Startpage() {

    const [flag, setFlag] = useState(0);

    function flagHandler(num:number){
            setFlag(num)
    }


    let render = <Register flag={flagHandler}></Register>

    if (flag == 0) {
        render = <Register flag={flagHandler}></Register>
    }
    else if (flag == 1) {
        render = <SignIn></SignIn>
    }
    else{
        render = <Login></Login>
    }

    return (
        <>
            <div className="bg-gray-800 h-screen text-white">
                {render}
            </div>

        </>
    )


}