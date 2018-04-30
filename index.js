var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var fs = require('fs');
var creds = '';

var redis = require('redis');
var client = '';

// Credencias do Redis capturadas via JSON
fs.readFile('creds.json', 'utf-8', function (err, data) {
    if (err) throw err;
    creds = JSON.parse(data);
    client = redis.createClient(6380,'whatslike.redis.cache.windows.net', {auth_pass: '4T+Aa/aiRSEJHezsfAYdXk8RNeu3NzmfJwLftLiJsvY=', tls: {servername: 'whatslike.redis.cache.windows.net'}});

    // Redis client
    client.once('ready', function () {

        // Atualiza DB
        client.flushdb();

        // Inicializa cache dos usuarios do chat
        client.get('chat_users', function (err, reply) {
            if (reply) {
                chatters = JSON.parse(reply);
            }
        });

        // Inicializa cache de mensagens
        client.get('chat_app_messages', function (err, reply) {
            if (reply) {
                chat_messages = JSON.parse(reply);
            }
        });
    });
});

var port = process.env.PORT || 5000;

// inicia o servidor
http.listen(port, function () {
    console.log('Servidor iniciado. escutando na porta *:' + port);
});

// Armazena pessoas no chat
var chatters = [];

// Armazena mensagens na sala
var chat_messages = [];

// Express Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// Renderiza o Main  do HTML
app.get('/', function (req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

// Chama API - Join Chat
app.post('/join', function (req, res) {
    var username = req.body.username;
    if (chatters.indexOf(username) === -1) {
        chatters.push(username);
        client.set('chat_users', JSON.stringify(chatters));
        res.send({
            'chatters': chatters,
            'status': 'OK'
        });
    } else {
        res.send({
            'status': 'FAILED'
        });
    }
});

// Chama API - Leave Chat
app.post('/leave', function (req, res) {
    var username = req.body.username;
    chatters.splice(chatters.indexOf(username), 1);
    client.set('chat_users', JSON.stringify(chatters));
    res.send({
        'status': 'OK'
    });
});

// Chama API - Send + Store Message
app.post('/send_message', function (req, res) {
    var username = req.body.username;
    var message = req.body.message;
    chat_messages.push({
        'sender': username,
        'message': message
    });
    client.set('chat_app_messages', JSON.stringify(chat_messages));
    res.send({
        'status': 'OK'
    });
});

// Chama API - Get Messages
app.get('/get_messages', function (req, res) {
    res.send(chat_messages);
});

// Chama API - Get Chatters
app.get('/get_chatters', function (req, res) {
    res.send(chatters);
});

// Conexão do Socket
io.on('connection', function (socket) {

    // Fluxo que envia evento de 'send' para a user interface (UI)
    socket.on('message', function (data) {
        io.emit('send', data);
    });

    // Fluxo que envia evento de 'update_chatter_count' para a user interface (UI)
    socket.on('update_chatter_count', function (data) {
        io.emit('count_chatters', data);
    });

});
