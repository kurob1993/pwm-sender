const axios = require('axios');
const fs = require('fs');

const LOGIN_FILE_PATH = './login.json';

let login;
if (fs.existsSync(LOGIN_FILE_PATH)) {
    login = require(LOGIN_FILE_PATH);
}

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
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
get_token();
