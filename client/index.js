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
        name:'jobA',
        process:function(done,job){
            //define job
            console.log("Start job A");
            job.progress(10);
            setTimeout(function(){
                console.log(job.data.x/job.data.y);
                done();
            },5000);
        }
    }
},function(socket){
});
