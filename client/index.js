var client = require('./client');
var config = require('./config.json');

client('jobA',function(done,job){
    console.log(`JobA ${job.id} start!`);
    console.log('Value:' + JSON.stringify(job.data,null,4));
    done();
});

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
