import PouchDB from 'pouchdb'


let db: PouchDB.Database<{}>;

export default function connectToDB() {

    db = new PouchDB("chatApp")

    return db

}

export function getDb() {

  if(db){
    return db;
  }
  else{
    throw new Error("Db error")
  }
}