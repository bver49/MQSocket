module.exports = function(option,_process,cb) {

    var Queue = require('bull');
    var defaultprocess;
    var defaultjobname;

    if(typeof option === 'function'){
        defaultprocess = option;
        option = {}
    }
    else if(typeof option === 'string'){
        defaultjobname = option;
        option = {}
    }

    option.job = option.job || {};
    option.redis = option.redis || {};
    option.socket = option.socket || {};
    option.socket.host = option.socket.host || 'http://127.0.0.1';
    option.socket.port = option.socket.port || '3000';
    option.socket.name = option.socket.name || `socket-${new Date().getTime()}`

    if(typeof defaultjobname === 'string'){
       option.job.name = defaultjobname;
   }else{
       option.job.name = option.job.name || 'job';
   }

    if(typeof defaultprocess === 'function'){
        option.job.process = defaultprocess;
    }else{
        option.job.process = _process;
    }

    var socket = require('socket.io-client')(`${option.socket.host}:${option.socket.port}`, {
        query: {
            name: option.socket.name,
            pw: option.socket.password || '',
            jobname: option.job.name
        }
    });

    var jobQueue = new Queue(option.job.name, {
        redis: {
            port: option.redis.port || 32768,
            host: option.redis.host || '127.0.0.1',
            db: option.redis.db || 0,
            password: option.redis.password || ''
        },
        prefix: option.redis.prefix || 'job'
    });
    console.log(`Try to connect socker on ${option.socket.host}:${option.socket.port}`);
    console.log(`Job name ${option.job.name}`);
    socket.on('connect', function() {
        if (typeof option.job.onConnect === 'function') {
            option.job.onConnect();
        }
        else {
            console.log('Connect to the server!');
        }
    });

    socket.on('disconnect', function() {
        if (typeof option.job.onDisconnect === 'function') {
            option.job.onDisconnect();
        }
        else {
            console.log('Disconnect with the server!');
        }
    });

    socket.on(`pauseall${option.job.name}`, function() {
        jobQueue.pause().then(function() {
            if (typeof option.job.onPauseall === 'function') {
                option.job.onPauseall();
            }
            else {
                console.log('All receiver has been paused!');
            }
        });
    });

    socket.on(`resumeall${option.job.name}`, function() {
        jobQueue.resume().then(function() {
            if (typeof option.job.onResumeall === 'function') {
                option.job.onResumeall();
            }
            else {
                console.log('All worker has been resumed!');
            }
        });
    });

    socket.on(`pause${option.job.name}${option.socket.name}`, function() {
        jobQueue.pause(true).then(function() {
            if (typeof option.job.onPause === 'function') {
                option.job.onPause();
            }
            else {
                console.log('This worker has been paused!');
            }
        });
    });

    socket.on(`resume${option.socket.name}`, function() {
        jobQueue.resume(true).then(function() {
            if (typeof option.job.onResume === 'function') {
                option.job.onResume();
            }
            else {
                console.log('This worker has been resumed!');
            }
        });
    });

    jobQueue.process(option.job.name, function(job, done) {
        if (typeof option.job.process === 'function') {
            option.job.process(function(){
                done();
            },job);
        }
        else {
            console.log("ERR: Has to defined process!");
        }
    });

    jobQueue.on('active', function(job, jobPromise) {
        if (typeof option.job.onActive === 'function') {
            option.job.onActive(function(data) {
                data = data || `Active: Worker ${option.socket.name} start working on Job ${job.id}!`;
                console.log(`Active: Start working on Job ${job.id}!`);
                socket.emit('active', data);
            }, job, result);
        }
        else {
            console.log(`Active: Start working on Job ${job.id}!`);
            socket.emit('active', `Active: Worker ${option.socket.name} start working on Job ${job.id}!`);
        }
    });

    jobQueue.on('progress', function(job, progress) {
        if (typeof option.job.onProgress === 'function') {
            option.job.onProgress(function(data) {
                data = data || `Progress: Worker ${option.socket.name} working on Job ${job.id} progress ${progress}%!`;
                console.log(`Progress: Job ${job.id} progress ${progress}% !`);
                socket.emit('progress', data);
            }, job, progress);
        }
        else {
            console.log(`Progress: Job ${job.id} progress ${progress}% !`);
            socket.emit('progress', `Progress: Worker ${option.socket.name} working on Job ${job.id} progress ${progress}%!`);
        }
    });

    jobQueue.on('completed', function(job, result) {
        if (typeof option.job.onCompleted === 'function') {
            option.job.onCompleted(function(data) {
                data = data || `Completed: Worker ${option.socket.name} completed Job ${job.id}!`;
                console.log(`Completed: Job ${job.id}!`);
                socket.emit('completed', data);
            }, job, result);
        }
        else {
            console.log(`Completed: Job ${job.id}!\n`);
            socket.emit('completed', `Completed: Worker ${option.socket.name} completed Job ${job.id}!`);
        }
    });

    jobQueue.on('error', function(err) {
        if (typeof option.job.onError === 'function') {
            option.job.onError(err, function(data) {
                data = data || err;
                console.log(`${err}`);
                socket.emit('err', data);
            });
        }
        else {
            console.log(`${err}`);
            socket.emit('err', err);
        }
    });

    jobQueue.on('failed', function(err) {
        if (typeof option.job.onFailed === 'function') {
            option.job.onFailed(err, function(data) {
                data = data || `Fail: Worker ${option.socket.name} Fail on Job ${err.id} ${err.failedReason}!`;
                console.log(`Fail on Job ${err.id} ${err.failedReason}!`);
                socket.emit('fail', data);
            });
        }
        else {
            console.log(`Fail on Job ${err.id} ${err.failedReason}!`);
            socket.emit('fail', `Fail: Worker ${option.socket.name} Fail on Job ${err.id} ${err.failedReason}`);
        }
    });

    if (typeof _process === 'function' && typeof defaultprocess === 'function') _process(socket,jobQueue);
    if (typeof cb === 'function') cb(socket,jobQueue);

}
