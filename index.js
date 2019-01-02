const shellExec = require('shell-exec');
const last = arr => arr[arr.length - 1];
const dropRight = (arr, n = 1) => arr.slice(0, -n);

const _config = require('./config.json');
const mysql = require('mysql');
const $db = mysql.createConnection(_config.db);
$db.connect();

const shell = 'ping ' + _config.host + ' -c 1';

setInterval(() => {
    shellExec(shell).then(function(answer){
        //let chunks = answer.stdout.split("\n");
        //console.log(chunks);
        var pong = 1;
        if(answer.stdout.indexOf('1 received') >= 0){
            pong =1;
        }else{
            pong = 0;
        }
        var value = 0;
        if(pong === 1){
            let chunks = answer.stdout.split("\n");
            var valueArrays = dropRight(chunks[1].split(" "),1);
            var valueString = last(valueArrays);
            //value = Number.parseFloat(valueString);
            value = valueString.match(/\d+(\.\d+)/);
            value = value[0];
        }

        var sql = "INSERT INTO `pinger_log` (`value`,`pong`) VALUES (?, ?)";

        $db.query(sql, [value, pong], function(error, results, fields){
            if (error) throw error;
        });
    });
}, 15000);