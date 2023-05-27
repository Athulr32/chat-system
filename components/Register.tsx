
import Image from "next/image"
import bgimage from "../encrypt.jpg"
import SignIn from "./SignIn"
export default function Register(props: any) {

    function changeHandler(e:any) {

        props.flag(e.target.value)

    }



    return (
        <div className="text-center text-white  h-screen lg:px-96 flex flex-col justify-center ">

            <div className="flex flex-col py-20 px-10 lg:border-white lg:border-2 ">
                <div>
                    <div className="flex justify-center">
                        <Image height="300" width="400" alt="image" src={bgimage} style={{ borderRadius: "20px" }} />

                    </div>

                    <div className="pt-10">Send Message Securely</div>

                </div>
                <div className="pt-40 flex flex-col">
                    <div className="pb-20">
                        <button onClick={changeHandler} value="1" className="bg-blue-700 p-4 px-1 rounded w-54">Create an Account</button>
                    </div>
                    <div>
                        <button onClick={changeHandler} value="2" className="bg-blue-700 p-4 px-1 rounded w-54">Already have an Account</button>
                    </div>
                </div>
            </div>

        </div>
    )


}