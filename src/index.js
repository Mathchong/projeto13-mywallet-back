import { MongoClient } from "mongodb";
import express from "express";
import cors from "cors";
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';

//TODO verificar para excluir sessões de x em x tempo

import { signUpSchema, logInSchema, movimentSchema } from './Joi/registerSchema.js'

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;
let usersCollection;
let sessionsCollection;
let movimentCollection;

mongoClient.connect().then(() => {
    db = mongoClient.db("my_wallet");
    usersCollection = db.collection('users')
    sessionsCollection = db.collection('sessions')
    movimentCollection = db.collection('moviment')
    console.log("Conectado ao servidor")
});

app.post('/register', async (req, res) => {
    try {
        //Valida body da requisição
        const validation = signUpSchema.validate(req.body, { abortEarly: false })
        if (validation.error) {
            console.log(validation.error.details)
            res.status(422).send('Preencha os campos corretamente');
            return;
        }
        //Verificar se não tem um e-mail igual no banco.
        const user = await usersCollection.findOne({ email: req.body.email })
        if (user) {
            res.status(409).send("Já temos um usuário cadastrado com esse email");
            return;
        }
        //Encripta a senha
        const encryptedPassword = bcrypt.hashSync(req.body.senha, 7)
        console.log(encryptedPassword)
        const salvarNoBanco = { name: req.body.name, email: req.body.email, senha: encryptedPassword }
        //Salva no banco
        let insersao = await usersCollection.insertOne(salvarNoBanco)
        console.log(insersao)
        res.status(201).send('Registro criado com sucesso')
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.post('/login', async (req, res) => {
    try {
        const bodyValidation = logInSchema.validate(req.body, { abortEarly: false });
        if (bodyValidation.error) {
            res.status(422).send("Por favor preencha os campos")
            return;
        }
        //E-mail, procurar no banco.
        const search = await usersCollection.findOne({ email: req.body.email })
        if (!search) res.status(404).send("Usuário não encontrado, por favor crie uma conta!")

        // Senha validar com o banco.
        if (bcrypt.compareSync(req.body.senha, search.senha)) {
            // Se passar, utilizar UUID(v4) para enviar token para o front.
            //Salvar Tokens nas sessões
            const token = uuid()
            const now = Date.now()
            const saveSession = await sessionsCollection.insertOne({ email: req.body.email, token, lastSession: now })
            console.log(saveSession)
            res.send(token)
            return
        }
        // Se não passar, enviar erro.
        res.status(401).send("Senha incorreta!")
        return
    } catch (err) {
        console.log(err)
        res.status(500).send("Poxa acho que deu ruim aqui, pera que vou chamar o tecnico")
        return
    }
})

app.post('/newEntry', async (req, res) => {
    try {

        const { authorization } = req.headers;
        const token = authorization?.replace("Bearer ", "").trim();
        if (!token) {
            res.sendStatus(401);
            return;
        }
        console.log(token, authorization)

        const session = await sessionsCollection.findOne({ token });
        if (!session) {
            return res.sendStatus(401);
        }
        console.log(session.email)

        const validation = movimentSchema.validate(req.body, { abortEarly: false })
        if (validation.error) {
            console.log(validation.error)
            res.status(422).send("Por favor preencha os campos")
            return;
        }

        const today = dayjs().format('DD/MM')
        const type = 'Entry'

        const obj = {
            valor: req.body.valor,
            descricao: req.body.descricao,
            data: today,
            type,
            email: session.email
        }

        const salvar = await movimentCollection.insertOne(obj)
        console.log(salvar)

        res.status(201).send("Movimentação criada!")
    } catch (err) {
        res.status(500).send("Internal Error")
    }
})

app.post('/newExpense', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const token = authorization?.replace("Bearer ", "").trim();
        if (!token) {
            res.sendStatus(401);
            return;
        }
        console.log(token, authorization)

        const session = await sessionsCollection.findOne({ token });
        if (!session) {
            return res.sendStatus(401);
        }
        console.log(session.email)

        const validation = movimentSchema.validate(req.body, { abortEarly: false })
        if (validation.error) {
            console.log(validation.error)
            res.status(422).send("Por favor preencha os campos")
            return;
        }

        const today = dayjs().format('DD/MM')
        const type = 'Expense'

        const obj = {
            valor: req.body.valor,
            descricao: req.body.descricao,
            data: today,
            type,
            email: session.email
        }

        const salvar = await movimentCollection.insertOne(obj)
        console.log(salvar)

        res.status(201).send("Movimentação criada!")
    } catch (err) {
        res.status(500).send("Internal Error")
    }
})

app.get('/moviment', async (req, res) => {
    try {
        console.log('Tentando acessar!')
        const { authorization } = req.headers;
        const token = authorization?.replace("Bearer ", "").trim();
        if (!token) {
            res.sendStatus(401);
            return;
        }
        console.log(token, authorization)

        const session = await sessionsCollection.findOne({ token });
        console.log("procurando a sessão")
        if (!session) {
            return res.sendStatus(401);
        }
        console.log("sessão encontrada")

        const email = { "email": session.email }
        console.log(email)
        const get = await movimentCollection.find(email).toArray()
        res.status(200).send(get);
        return
    } catch (err) {
        res.status(500).send("Internal Error")
        return
    }
})


app.listen(5000, () => { console.log('Listening on port 5000') })