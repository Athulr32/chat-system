

export default function BottomBar({trackPageFunction}:{trackPageFunction:Function}) {

    function setTrack(e:any){
        console.log(e.currentTarget.id)
        trackPageFunction(Number(e.currentTarget.id))

    }


    return (
        <div style={{width:"100%"}} className="fixed bottom-0 px-10 py-5 bg-black text-white rounded">

            <div className="flex flow-row justify-between">
                <div id="0" onClick={setTrack}>Contacts</div>
                <div id="1" onClick={setTrack}>Chats</div>
                <div id="2" onClick={setTrack}>About</div>
            </div>
        </div>
    )



}