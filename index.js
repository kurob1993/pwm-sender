const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { Client } = require('whatsapp-web.js');

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

const fs = require('fs');
const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const LOGIN_FILE_PATH = './login.json';
let login;
if (fs.existsSync(LOGIN_FILE_PATH)) {
    login = require(LOGIN_FILE_PATH);
}

let get_token = async () => {
    await axios.post('http://127.0.0.1:8000/api/v1/login', login)
        .then(function (response) {
            // handle success
            localStorage.setItem('token', response.data.success.api_token);
        }).catch(function (error) {
            // handle error
            console.log(error.response.statusText);
            localStorage.removeItem('token');
        }).then(function () {
            // always executed
        });

    return localStorage.getItem('token')
}

let sending = async (token) => {
    await axios({
        method: 'get',
        url: 'http://127.0.0.1:8000/api/v1/message/sending',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
        .then(function (response) {
            // handle success
            var myJSON = JSON.stringify(response.data.success);
            localStorage.setItem('message', myJSON);
        }).catch(function (error) {
            // handle error
            console.log(error.response.statusText);
            localStorage.removeItem('message');
        }).then(function () {
            // always executed
        });

    return localStorage.getItem('message')
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });
client.initialize();

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', (session) => {
    // console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
    try {
        fs.unlinkSync(SESSION_FILE_PATH)
    } catch (err) {
        console.error(err)
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    localStorage.setItem('disconnected', 1);
    try {
        fs.unlinkSync(SESSION_FILE_PATH)
    } catch (err) {
        console.error(err)
    }
});

function loop() {
    var rand = Math.round(Math.random() * 20000);
    setTimeout(async function () {
        let token = await get_token();
        let message = await sending(token);

        if (message !== 'null') {
            let obj = JSON.parse(message);
            let number = obj.number;
            let text = obj.text;
            await client.sendMessage(number + '@c.us', text);
            console.log(number + ' : ' + text + ' a millisecond: ' + rand);
        } else {
            console.log('not message' + ' a millisecond: ' + rand);
        }

        if (localStorage.getItem('disconnected') == 0) {
            loop();
        }
        
    }, rand);
}

client.on('ready', async () => {
    console.log('Client is ready!');
    localStorage.setItem('disconnected', 0);
    loop();
});

client.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // console.log(msg);
        
    }
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if(ack == 2) {
        console.log(msg);
    }
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});