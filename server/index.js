var express = require('express');
var app = express();
var server = require('http').Server(app);
var mq = require('./server');
var config = require('./config.json');

app.use(mq(server));

app.use(mq(server,{
    redis:{
        host: '127.0.0.1',
        port: '32768',
        db:1
    },
    job:{
        name:'jobB',
        limitsec:30
    }
}));

app.get('/A',function(req,res){
    req.jobAMQ.addJob({
        x:1,
        y:2
    });
    res.send(req.connectSocket);
});

server.listen(3000, function() {
    console.log('Server on 3000!');
});
