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
    port? : NUMBER = 6379,              //Port of the redis.
    host? : STRING = '127.0.0.1',       //Host of the redis. 
    db? : NUMBER = 0,                   //Redis database use for the queue.
    password? : STRING = '',            //Password of redis. 
    prefix? : STRING = 'job'            //Data prefix in the redis.
  },
  job:{
    name? : STRING = 'job',              //Name of the job.
    limitsec? : NUMBER = null,           //Limit time for job process. 
    removeOnComplete? : BOOLEAN = false  //Remove the job from the queue when job completed
    removeOnFail? : BOOLEAN = false      //Remove the job from the queue when job failed
  },
  socket:{
    password? : STRING = ''              //Password of the socket server
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

#### addJob() -> Promise <job>

Add a job into the queue

```js
app.get('/',function(req,res){
  req.jobnameMQ.addJob({
    key1:value1
  });
});
```

#### getJob(jobid) -> Promise <data>

Get the progress and data of the job by jobid

```js
app.get('/',function(req,res){
  req.jobnameMQ.getJob(jobid).then(function(data){
  });
});
```

#### Clean() -> Promise <job,type>

Clean the job in the queue

Type : wait,active,completed,failed,delayed

```js
app.get('/',function(req,res){
  req.jobnameMQ.clean(type);
  res.send('ok');
});
```

#### jobCount -> Promise <data>

Retuen the amount of the job in the queue

```js
app.get('/',function(req,res){
  req.jobnameMQ.jobCounts().then(function(data){
    res.send(data);
  });
});
```

#### pauseAll() -> Promise

Pause all client working for the job

```js
app.get('/',function(req,res){
  req.jobnameMQ.pauseall();
  res.send('ok');
});
```

#### resumeAll() -> Promise

Resume all client working for the job

```js
app.get('/',function(req,res){
  req.jobnameMQ.resumeall();
  res.send('ok');
});
```

#### Pause() -> Promise

Pause a client working for the job by client name

```js
app.get('/',function(req,res){
  req.jobnameMQ.pause(clientName);
  res.send('ok');
});
```

#### Resume() -> Promise

Resume a client working for the job by client name

```js
app.get('/',function(req,res){
  req.jobnameMQ.resume(clientName);
  res.send('ok');
});
```

### Other

#### Connect socket (req.connectSocket)

Show names of job queue and client names work on the job control by this server.

```js
app.get('/',function(req,res){
  res.send(req.connectSocket);
});
```

#### Socket (req.io)

Object of the socket.

```js
app.get('/',function(req,res){
  req.io.emit('Some massage');   //emit message to client
  res.send('ok');
});
```

## Client

### Quick Guide

```js
var client = require('./mqsocket/client');

//Easy way

client('jobA',function(done,job){
    console.log(`JobA ${job.id} start!`);
    console.log('Value:' + JSON.stringify(job.data,null,4));
    done();
});

//Custom usage

client({
    job:{
        name:'jobB'
    },
    redis:{
        db:1
    }
},function(done,job){
    console.log(`JobB ${job.id} start!`);
    console.log('Value:' + JSON.stringify(job.data,null,4));
    done();
});

```

### Setting

Require the module

```js
var client = require('./mqsocket/client');
```

#### Easy way

```js
client(jobname,process,cb);
```

```js
jobname : STRING         // Name of the job
process : FUNCTION(done,job)  // Defined the process of the job, call done() when process done
cb? : FUNCTION(socket,jobQueue)  
```

#### Custom

```js
client(Opts,process,cb);
```

##### Setting in Opts

```js
interface Opts {
  redis:{
    port? : NUMBER = 6379                  //Port of the redis.
    host? : STRING = '127.0.0.1'           //Host of the redis. 
    db? : NUMBER = 0                       //Redis database use for the queue.
    password? : STRING = ''                //Password of redis. 
    prefix? : STRING = 'job'               //Data prefix in the redis.
  },
  job:{
    name? : STRING = 'job',                //Name of the job.  
    onActive? : FUNCTION(cb,job)           //Execute when a job start, call cb(msg) to send msg back to server
    onProgress? : FUNCTION(cb,job,progres) //Execute when the progress of the job has been update, call cb(msg) to send msg back to server
    onCompleted? : FUNCTION(cb,job,result) //Execute when a job completed, call cb(msg) to send msg back to server
    onError? : FUNCTION(cb,err)            //Execute when error, call cb(msg) to send msg back to server 
    onFailed? : FUNCTION(cb,err)           //Execute when a job failed, call cb(msg) to send msg back to server   
  },
  socket:{
    password? : STRING = '',               //Password for the socket server.
    host? : STRING = '127.0.0.1'           //Host for the socket server. 
    port? : NUMBER = '3000'                //Port for the socket server.
    name? : NAME = 'socket-TIMESTAMP'      //Name of the socket client.
    onConnect? : FUNCTION(socket)          //Execute when a socket client connect to the server
    onDisconnect? : FUNCTION(data)         //Execute when a socket client disconnect with the server
  }
}
```

### Defined process


