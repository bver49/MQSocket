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
            //define job
            done();
        }
    }
},function(socket){
});
