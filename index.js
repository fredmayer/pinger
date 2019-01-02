const shellExec = require('shell-exec');
const last = arr => arr[arr.length - 1];
const dropRight = (arr, n = 1) => arr.slice(0, -n);

const _config = require('./config.json');
const mysql = require('mysql');
const $moment = require('moment');
const $db = mysql.createConnection(_config.db);
$db.connect();

const shell = 'ping ' + _config.host + ' -c 1 -W 2';
let $interval = 15000;
let startInterval = 500;
var timerLoss = false;

var timerId = setTimeout(function timer(){
    shellExec(shell).then(function(answer){
        var dtStart = $moment();

        var pong = 1;
        if(answer.stdout.indexOf('1 received') >= 0){
            pong =1;
        }else{
            pong = 0;
            if(timerLoss === false){
                console.log('loss timer start');
                timerLoss = setTimeout(loss, 1000, dtStart);
            }
        }
        var value = 0;
        if(pong === 1){
            let chunks = answer.stdout.split("\n");
            var valueArrays = dropRight(chunks[1].split(" "),1);
            var valueString = last(valueArrays);
            //value = Number.parseFloat(valueString);
            value = valueString.match(/\d+(\.\d+)/);
            if(value[0] !== undefined){
                value = value[0];
            }else{
                value = 0;
            }
        }

        var sql = "INSERT IGNORE INTO `pinger_log` (`value`,`pong`) VALUES (?, ?)";

        $db.query(sql, [value, pong], function(error, results, fields){
            if (error) throw error;

            console.log('ping: ' + pong + '; ' + value + ' ms');
        });

        timerId = setTimeout(timer, 15000);
    });
}, 500);

function loss(dtStart){
    shellExec('ping ' + _config.host + ' -c 1 -W 1').then(function(answer){
        if(answer.stdout.indexOf('1 received') >= 0){
            var dtEnd = $moment();
            var sql = "INSERT INTO `losses_log` (dt_start, dt_end, duration) VALUES (?, ?, ?)";
            var duration = dtEnd.diff(dtStart, 'seconds');

            $db.query(sql, [dtStart.format('YYYY-MM-DD HH:mm:ss'), dtEnd.format('YYYY-MM-DD HH:mm:ss'), duration], function(error, results, fields){
                if (error) throw error;

                console.log('Loss Timer end: ' + dtStart.format() + ' - ' + dtEnd.format() + '; ' + duration);
            });
            timerLoss = false;
        }else{
            timerLoss = setTimeout(loss, 1000, dtStart);
        }
    });
    
}
