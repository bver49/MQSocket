var client = require('./client');
var config = require('./config.json');

client({
    socket: {
        host: config.socket.host,
        name: config.socket.name,
        pw: config.socket.pw
    },
    redis: {
        port: config.redis.port,
        host: config.redis.host,
        db: config.redis.db,
        prefix:'job'
    },
    job:{
        name:'apkbuilder',
        process:function(done,job){
            console.log('Start');
            job.progress(10);
            setTimeout(function(){
                job.progress(100);
                done();
            },5000);
        }
    }
},function(socket){
});
