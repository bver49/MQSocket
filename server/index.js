var express = require('express');
var app = express();
var server = require('http').Server(app);
var mq = require('./server');
var config = require('./config.json');

app.use(mq(server));

app.use(mq(server,{
    redis:{
        port: 32768
    },
    job:{
        name:'jobA'
    }
}));

app.use(mq(server,{
    redis:{
        port: 32768,
        db:1
    },
    job:{
        name:'jobB'
    }
}));

app.get('/A',function(req,res){
    req.jobAMQ.addJob({
        x:1,
        y:2
    }).then(function(job){
        res.send({id:job.id});
    });
});

app.get('/B',function(req,res){
    req.jobBMQ.addJob({
        x:1,
        y:2
    }).then(function(job){
        res.send({id:job.id});
    });
});


server.listen(3000, function() {
    console.log('Server on 3000!');
});
