import Image from 'next/image'
import { Inter } from 'next/font/google'
const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const inter = Inter({ subsets: ['latin'] })
import { encrypt, decrypt, PrivateKey } from 'eciesjs'

async function login() {

  const msg = Uint8Array.from(Buffer.from("hello"))


  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msg);
  const msgHash = new Uint8Array(hashBuffer);
 

  let privKey = new Uint8Array([
    35,
    187,
    168,
    3,
    113,
    83,
    238,
    247,
    246,
    79,
    239,
    83,
    243,
    237,
    173,
    29,
    14,
    67,
    10,
    142,
    242,
    232,
    143,
    96,
    150,
    200,
    232,
    23,
    108,
    204,
    20,
    110
  ])

  //10 18
  // get the public key in a compressed format
  const pubKey = secp256k1.publicKeyCreate(privKey)

  // sign the message
  const sigObj = secp256k1.ecdsaSign(msgHash, privKey)

  var buff = new Buffer(pubKey, 'utf8');
  console.log(buff.toString("hex"))

  let data = {
    signature: [...sigObj.signature],
    recid: sigObj.recid,
    message: "hello",
    pub_key: [...pubKey],
  }

  console.log(JSON.stringify(data))
  const ress = await fetch("http://localhost:3011/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  })

  const response = await ress.json();
  
  console.log(response)

}

export default function Home() {
  return (
    <div>

      <div onClick={login}>Login</div>



    </div>
  )
}
