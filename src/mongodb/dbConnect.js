import { MongoClient } from "mongodb";
import { signUpSchema } from "./joi/registerSchema.js"

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient.connect().then(async () => {
    try {
        db = mongoClient.db("my_wallet");
        console.log("Conectado ao servidor")
    } catch (e) { console.log(e) }
});

export { db };