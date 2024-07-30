const url = process.env.API_URL || 'http://localhost:8002';
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');

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

logWithLineNumber = (message) => {
  const stack = new Error().stack;
  const stackLines = stack.split('\n');
  const callerLine = stackLines[2]; // The third line should be the caller
  const lineNumber = callerLine.match(/:(\d+):\d+/)[1]; // Extract the line number
  console.log(`Line ${lineNumber}: ${message}`);
}

getRandomMilliseconds = () => {
    const minMilliseconds = 30000; // 30 detik
    const maxMilliseconds = 60000; // 1 menit
    return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
}

let get_token = async () => {
    let res = null;
    await axios.post(url+'/api/v1/login', login)
        .then(function (response) {
            // handle success
            logWithLineNumber('get token success');
            res = response.data.data.api_token
        }).catch(function (error) {
            // handle error
            logWithLineNumber(error);
        }).then(function (res) {
            // always executed
        });

    return res
}

let sending = async (token) => {
    let res = null;
    await axios({
        method: 'get',
        url: url+'/api/v1/message/sending',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
        .then(function (response) {
            // handle success
            var myJSON = JSON.stringify(response.data.success);
            res = myJSON
            // localStorage.setItem('message', myJSON);
        }).catch(function (error) {
            // handle error
            logWithLineNumber(JSON.stringify(error));
            // localStorage.removeItem('message');
        }).then(function () {
            // always executed
        });

    return res
}

let sended = async (token,id) => {
    res = null;
    await axios({
        method: 'post',
        url: url+'/api/v1/message/sended',
        data: {
            id: id
        },
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
        .then(function (response) {
            // handle success
            var myJSON = JSON.stringify(response.data.success);
            var res = myJSON
            logWithLineNumber(myJSON);
        }).catch(function (error) {
            // handle error
        }).then(function () {
            // always executed
        });

    return res
}

const client = new Client({ 
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox'],
        timeout: 60000
    }, 
    authStrategy: new LocalAuth()
});

client.initialize();

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    logWithLineNumber('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    logWithLineNumber('Client was logged out', reason);
});

function loop() {
    var rand = getRandomMilliseconds();
    logWithLineNumber('next message will be sent in ' + (rand / 1000) + ' seconds');

    setTimeout(async function () {
        let token = await get_token();
        let message = await sending(token);

        if (message !== 'null') {
            try {
                let obj = JSON.parse(message);
                let number = obj.number;
                let text = obj.text;

                // milllisecond to second
                await client.sendMessage(number + '@c.us', text);
                logWithLineNumber(number + ' : ' + text);
            } catch (err) {
                logWithLineNumber(err);
            }
        }

        loop();

    }, rand);
}

client.on('ready', async () => {
    logWithLineNumber('Client is ready!');
    loop();
});

client.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // logWithLineNumber(msg);
        
    }
});

client.on('message_ack', async (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */
    if(Number(ack) === -1) {
        logWithLineNumber('ACK_ERROR');
    }
    if(Number(ack) === 0) {
        logWithLineNumber('ACK_PENDING');
    }
    if(Number(ack) === 1) {
        logWithLineNumber('ACK_SERVER');
    }
    if(Number(ack) === 2) {
        logWithLineNumber('ACK_DEVICE');
    }
    if(Number(ack) === 3) {
        logWithLineNumber('ACK_READ');
    }
    if(Number(ack) === 4) {
        logWithLineNumber('ACK_PLAYED');
    }
});

client.on('message', msg => {
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});