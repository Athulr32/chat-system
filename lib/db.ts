import PouchDB from 'pouchdb-browser'

export default function connectToDB() {

    let db = new PouchDB("chatApp")

    return db;
}