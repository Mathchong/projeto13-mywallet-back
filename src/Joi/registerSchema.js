import Joi from 'joi';

const signUpSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .required(),
    email: Joi.string()
        .email()
        .required(),
    senha: Joi.string()
        .min(8)
        .required(),
    repetir_senha: Joi.ref('senha'),
})

const logInSchema = Joi.object({
    email: Joi.string()
        .email()
        .required(),
    senha: Joi.string()
        .min(8)
        .required(),
})

const movimentSchema = Joi.object({
    valor: Joi.number()
        .positive()
        .precision(2)
        .required(),
    descricao: Joi.string().
        required()        
})

export {signUpSchema, logInSchema, movimentSchema};