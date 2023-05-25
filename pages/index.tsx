
import Startpage from '@/components/StartPage'
import { getCookie } from 'cookies-next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'



export default function Home() {
  let router = useRouter();

  useEffect(() => {
    let tok = getCookie("token")

    if (tok) {
      router.push("/chat")
    }

  }, [])


  return (
    <div>

      <Startpage></Startpage>


    </div>
  )
}
