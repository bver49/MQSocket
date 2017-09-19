# MQSocket

## Server

### Quick Guide

Use it as a express middleware

```js
var express = require('express');
var app = express();
var server = require('http').Server(app);
var mq = require('./mqsocket/server');

//Use default setting
app.use(mq(server));

//Custom setteing
app.use(mq(server,{
    redis:{
        port : REDIS_PORT,
        host : REDIS_HOST,
        db : REDIS_DATABASE,
        password : REDIS_PASSWORD,
        prefix : REDIS_PREFIX 
    },
    job:{
        name:'counting'
    },
    socket:{
      password: SOCKET_PASSWORD
    }
}));

app.get('/addjob',function(req,res){
  req.countingMQ.addJob({
    a:1,
    b:2
  });
  res.send('ok');
});

server.listen(3000);

```

### Setting

Add the module into middleware

```js
app.use(mq(server,Opts));
```

server is created by http module like this

```js
var app = require('express')();
var server = require('http').Server(app);
```

Setting in Opts

```js
interface Opts {
  redis:{
    port? : NUMBER = 6379,              //Port for the redis.
    host? : STRING = '127.0.0.1',       //Host for the redis. 
    db? : NUMBER = 0,                   //Redis database use for the queue.
    password? : STRING = '',            //Redis password. 
    prefix? : STRING = 'job'            //Data prefix in the redis.
  },
  job:{
    name? : STRING = 'job',              //Name for the job.
    limitsec? : NUMBER = null,           //Limit time for job process. 
    removeOnComplete? : BOOLEAN = false  //Remove the job from the queue when job completed
    removeOnFail? : BOOLEAN = false      //Remove the job from the queue when job failed
  },
  socket:{
    password? : STRING = ''              //Password for the socket server
    onConnect? : FUNCTION(socket)        //Execute when a socket client connect to the server
    onActive? : FUNCTION(data)           //Execute when a job start 
    onProgress? : FUNCTION(data)         //Execute when the progress of the job has been update 
    onCompleted? : FUNCTION(data)        //Execute when a job completed
    onError? : FUNCTION(data)            //Execute when error 
    onFailed? : FUNCTION(data)           //Execute when a job failed
    onDisconnect? : FUNCTION(data)       //Execute when a socket client disconnect with the server  
  }
}
```

### Usage

Control queue and job in route

Use the method in req.jobnameMQ

#### Add Job

Add a job into the queue

```js
app.get('/',function(req,res){
  res.jobnameMQ.addJob({
    key1:value1
  });
});
```

#### Get Job

Get the progress and data of the job by jobid

```js
app.get('/',function(req,res){
  res.jobnameMQ.getJob(jobid).then(function(data){
  });
});
```

#### Clean queue

Clean the job in the queue

Type : wait,active,completed,failed,delayed

```js
app.get('/',function(req,res){
  res.jobnameMQ.clean(type);
  res.send('ok');
});
```

#### Job count

Retuen the amount of the job in the queue

```js
app.get('/',function(req,res){
  res.jobnameMQ.jobCounts().then(function(data){
    res.send(data);
  });
});
```

#### Pause all client

Pause all client working for the job

```js
app.get('/',function(req,res){
  res.jobnameMQ.pauseall();
  res.send('ok');
});
```

#### Resume all client

Resume all client working for the job

```js
app.get('/',function(req,res){
  res.jobnameMQ.resumeall();
  res.send('ok');
});
```

#### Pause a client

Pause a client working for the job by client name

```js
app.get('/',function(req,res){
  res.jobnameMQ.pause(clientName);
  res.send('ok');
});
```

#### Resume a client

Resume a client working for the job by client name

```js
app.get('/',function(req,res){
  res.jobnameMQ.resume(clientName);
  res.send('ok');
});
```

### Other

#### Connect sockets

Show name of job queue and client names work on the job control by this server.

```js
app.get('/',function(req,res){
  res.send(req.connectSocket);
});
```

#### Socket

Object of the socket.

```js
app.get('/',function(req,res){
  req.io.emit('Some massage');   //emit message to client
  req.send('ok');
});
```


