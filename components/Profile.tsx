import { getCookie } from "cookies-next"


export default function Profile() {

    const name: string = getCookie("name") as string;
    const pubKey: string = getCookie("pubKey") as string;

    return (
        <div className="text-center pt-20 ov">

            <div className="">{name}</div>
            <div>
                <div className="font-sm px-10 break-all">{pubKey}</div>

            </div>

        </div>
    )




}