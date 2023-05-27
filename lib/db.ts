import PouchDB from 'pouchdb'




export default function connectToDB() {

    let db = new PouchDB("chatApp")

    return db

}

