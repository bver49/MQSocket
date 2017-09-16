var express = require('express');
var app = express();
var server = require('http').Server(app);
var mq = require('./server');
var config = require('./config.json');

app.use(mq(server,{
    redis:{
        host: '127.0.0.1',
        port: '32768',
        db:0
    },
    job:{
        name:'job',
        limitsec:30
    }
}));

app.get('/',function(req,res){
    req.jobQueue.addJob({
        x:123,
        y:12
    });
    res.send({
        connectSocket:req.connectSocket
    });
});

app.get('/pause',function(req,res){
    req.jobQueue.pauseall();
    res.send({
        connectSocket:req.connectSocket
    });
});

app.get('/resume',function(req,res){
    req.jobQueue.resumeall();
    res.send({
        connectSocket:req.connectSocket
    });
});

server.listen(3000, function() {
    console.log('Server on 3000!');
});
