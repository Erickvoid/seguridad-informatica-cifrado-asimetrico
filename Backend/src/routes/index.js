const { Router } = require('express');
const router = Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs')
let passwordEncripted;


function encrypt(toEncrypt) {
    const publicKey = fs.readFileSync('rsa_4096_pub.pem', {encoding:'utf8', flag:'r'})
    const buffer = Buffer.from(toEncrypt)
    const encrypted = crypto.publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64')
}

function decrypt(toDecrypt) {
    const privateKey = fs.readFileSync("rsa_4096_priv.pem", {encoding:'utf8', flag:'r'});
    const buffer = Buffer.from(toDecrypt, "base64");
    const password = crypto.privateDecrypt(privateKey,buffer);
    return password.toString("utf8");
}

let enc = encrypt("");

router.get('/', (req, res) => {
    res.send('Backend Funcionando ⚙')
});

router.post('/register', async (req, res) => {
    const { userName,password,name,apellidoPaterno,apellidoMaterno,phoneNum,addressCalle,addressColonia,codPostal } = req.body;
	try {
        console.log(password)
        passwordEncripted = encrypt(`${password}`);
        console.log(passwordEncripted)
	} catch (error) {
		console.log(error);
	}
    const newUser = new User({userName,passwordEncripted,name,apellidoPaterno,apellidoMaterno,phoneNum,addressCalle,addressColonia,codPostal});
    let userInUse = await User.findOne({userName})
    console.log(`The user in the databse is ${userInUse}`)    
	console.log(newUser);
	if (userInUse) {
		return res.status(401).send('El Usuario ya existe');
	}else{
		await newUser.save();
		const token = await jwt.sign({_id: newUser._id}, 'secretkey');
		res.status(200).json({token});
	}
});


router.post('/login', async (req, res) => {
try {
	const { userName, password } = req.body;
	const user = await User.findOne({ userName });
	if (!user) return res.status(401).send('El Usuario no existe');
	try {
        let deciphered = decrypt(user.passwordEncripted)
		assert.equal(deciphered, password, "Error en la contraseña!");
		const token = jwt.sign({ _id: user._id }, 'secretkey');
		return res.status(200).json({ token });
	} catch (error) {
		return res.status(400).send('Error en la contraseña.'),
		console.log(error);
	}
} catch (error) {
	console.log(error);}
});

module.exports = router;
