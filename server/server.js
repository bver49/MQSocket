var Queue = require('bull');
var socketio = require('socket.io');

module.exports = function(server, option) {
    var io = socketio(server);
    var connectSocket = [];
    option.socket = option.socket || {};
    option.socket.pw = option.socket.pw || '';
    option.job.name = option.job.name || 'job'

    var jobQueue = new Queue(option.job.name, {
        redis: {
            port: option.redis.port || 6379,
            host: option.redis.host || '127.0.0.1',
            db: option.redis.db ||0
        },
        prefix: option.redis.prefix || 'job'
    });

    var job = {
        addJob:function(job,id) {
            return jobQueue.add(option.job.name,job,{
                jobId: id,
                timeout : option.job.limitsec * 1000
            });
        },
        getJob:function(id){
            return jobQueue.getJob(id);
        },
        clean:function(type){
            type = type || 'failed';
            return jobQueue.clean(1000,type);
        },
        empty:function(){
            return jobQueue.clean(1000);
        },
        jobCounts:function(){
            return jobQueue.getJobCounts();
        },
        pauseall:function(){
            io.emit('pauseall');
            console.log('All worker has been paused!');
        },
        resumeall:function(){
            io.emit('resumeall');
            console.log('All worker has been resumed!');
        },
        pause:function(name){
            io.emit(`pause${name}`);
            console.log(`Worker ${name} has been paused!`);
        },
        resume:function(name){
            io.emit(`resume${name}`)
            console.log(`Worker ${name} has been resumed!`);
        }
    }

    io.on('connection', function(socket) {
        if (socket.handshake.query.pw === option.socket.pw) {
            connectSocket.push(socket.handshake.query.name);
            if (typeof option.socket.onConnect === 'function') {
                option.socket.onConnect(socket);
            }
            else {
                console.log(`Worker ${socket.handshake.query.name} connect!`);
            }

            socket.on('active', function(msg) {
                if (typeof option.socket.onActive === 'function') {
                    option.socket.onActive(msg);
                }
                else {
                    console.log(msg);
                }
            });

            socket.on('progress', function(msg) {
                if (typeof option.socket.onProgress === 'function') {
                    option.socket.onProgress(msg);
                }
                else {
                    console.log(msg);
                }
            });

            socket.on('completed', function(msg) {
                if (typeof option.socket.onCompleted === 'function') {
                    option.socket.onCompleted(msg);
                }
                else {
                    console.log(msg);
                }
            });

            socket.on('err', function(msg) {
                if (typeof option.socket.onError === 'function') {
                    option.socket.onError(msg);
                }
                else {
                    console.log(msg);
                }
            });

            socket.on('fail', function(msg) {
                if (typeof option.socket.onFailed === 'function') {
                    option.socket.onFailed(msg);
                }
                else {
                    console.log(msg);
                }
            });

            socket.on('disconnect', function() {
                connectSocket.splice(connectSocket.indexOf(socket.handshake.query.name), 1);
                if (typeof onDisconnect === 'function') {
                    option.socket.onDisconnect(socket);
                }
                else {
                    console.log(`Worker ${socket.handshake.query.name} disconnect!`);
                }
            });
        }
        else {
            socket.disconnect();
        }
    });

    return function(req, res, next) {
        req[`${option.job.name}MQ`].jobQueue = job;
        req[`${option.job.name}MQ`].connect = connectSocket;
        req.io = io;
        next();
    }
}
