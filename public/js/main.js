$(function () {

    // test
    var socket = io();
    var chat_count;
    $.get('/get_chatters', function (response) {
        $('.chat-info').text("Existem " + response.length + " pessoas conectadas nesta sala.");
        chat_count = response.length; //update do contador da sala
    });
    $('#entrar-chat').click(function () {
        var username = $.trim($('#username').val());
        $.ajax({
            url: '/join',
            type: 'POST',
            data: {
                username: username
            },
            success: function (response) {
                if (response.status == 'OK') { //verifica se o username já existe na sala.
                    socket.emit('update_chat_count', {
                        'action': 'increase'
                    });
                    $('.chat').show();
                    $('#sair-chat').data('username', username);
                    $('#enviar-mensagem').data('username', username);
                    $.get('/get_messages', function (response) {
                        if (response.length > 0) {
                            var message_count = response.length;
                            var html = '';
                            for (var x = 0; x < message_count; x++) {
                                html += "<div class='msg'><div class='user'>" + response[x]['sender'] + "</div><div class='txt'>" + response[x]['message'] + "</div></div>";
                            }
                            $('.messages').html(html);
                        }
                    });
                    $('.entrar-chat').hide(); //esconde a descricão para os que já estão na sala.
                } else if (response.status == 'FAILED') { //username já existe na sala!
                    alert("Desculpe mas o username já existe, por favor escolha outro");
                    $('#username').val('').focus();
                }
            }
        });
    });
    $('#sair-chat').click(function () {
        var username = $(this).data('username');
        $.ajax({
            url: '/leave',
            type: 'POST',
            dataType: 'json',
            data: {
                username: username
            },
            success: function (response) {
                if (response.status == 'OK') {
                    socket.emit('message', {
                        'username': username,
                        'message': username + " deixou a sala..."
                    });
                    socket.emit('update_chat_count', {
                        'action': 'decrease' // atualiza o numero de usuarios na sala "diminui".
                    });
                    $('.chat').hide();
                    $('.entrar-chat').show();
                    $('#username').val('');
                    alert('Você deixou a sala com sucesso. Obrigado!');
                }
            }
        });
    });
    $('#enviar-mensagem').click(function () {
        var username = $(this).data('username');
        var message = $.trim($('#message').val());
        $.ajax({
            url: '/send_message',
            type: 'POST',
            dataType: 'json',
            data: {
                'username': username,
                'message': message
            },
            success: function (response) {
                if (response.status == 'OK') {
                    socket.emit('message', {
                        'username': username,
                        'message': message
                    });
                    $('#message').val('');
                }
            }
        });
    });
    socket.on('send', function (data) {
        var username = data.username;
        var message = data.message;
        var html = "<div class='msg'><div class='user'>" + username + "</div><div class='txt'>" + message + "</div></div>";
        $('.messages').append(html);
    });
    socket.on('count_chatters', function (data) {
        if (data.action == 'increase') {
            chat_count++;
        } else {
            chat_count--;
        }
        $('.chat-info').text("Existem atualmente " + chat_count + " pessoas conectadas nesta sala.");
    });
});
