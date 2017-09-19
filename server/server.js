var Queue = require('bull');
var socketio = require('socket.io');

module.exports = function(server, option) {

    var io = socketio(server);
    var connectSocket = {};

    option = option || {};
    option.job = option.job || {};
    option.redis = option.redis || {};
    option.socket = option.socket || {};
    option.job.name = option.job.name || 'job'
    option.socket.pw = option.socket.pw || '';

    var jobQueue = new Queue(option.job.name, {
        redis: {
            port: option.redis.port || 6379,
            host: option.redis.host || '127.0.0.1',
            db: option.redis.db || 0,
            password: option.redis.password || ''
        },
        prefix: option.redis.prefix || 'job'
    });

    var job = {
        addJob: function(job, id, priority) {
            return jobQueue.add(option.job.name, job, {
                jobId: id,
                timeout: (option.job.limitsec) ? (option.job.limitsec * 1000) : null,
                priority:priority,
                removeOnComplete:option.job.removeOnComplete || false,
                removeOnFail: option.job.removeOnFail ||false
            });
        },
        getJob: function(id) {
            return jobQueue.getJob(id);
        },
        Clean: function(type) {
            type = type || 'failed';
            return jobQueue.clean(1000, type);
        },
        Empty: function() {
            return jobQueue.clean(1000);
        },
        jobCounts: function() {
            return jobQueue.getJobCounts();
        },
        pauseAll: function() {
            io.emit(`pauseall${option.job.name}`);
            console.log(`All worker on ${option.job.name} has been paused!`);
        },
        resumeAll: function() {
            io.emit(`resumeall${option.job.name}`);
            console.log(`All workers on ${option.job.name} has been resumed!`);
        },
        Pause: function(name) {
            io.emit(`pause${option.job.name}${name}`);
            console.log(`Worker ${name} has been paused!`);
        },
        Resume: function(name) {
            io.emit(`resume${option.job.name}${name}`)
            console.log(`Worker ${name} has been resumed!`);
        }
    }

    io.on('connection', function(socket) {
        this.ids = option.job.name;
        if (socket.handshake.query.pw === option.socket.pw) {
            if (connectSocket[socket.handshake.query.jobname]) {
                connectSocket[socket.handshake.query.jobname].push(socket.handshake.query.name);
            }
            else {
                connectSocket[socket.handshake.query.jobname] = [socket.handshake.query.name];
            }
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
                connectSocket[socket.handshake.query.jobname].splice(connectSocket[socket.handshake.query.jobname].indexOf(socket.handshake.query.name), 1);
                if (connectSocket[socket.handshake.query.jobname].length == 0) delete connectSocket[socket.handshake.query.jobname];

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
        req.connectSocket = connectSocket;
        req.io = io;
        req[`${option.job.name}MQ`] = job;
        next();
    }
}
