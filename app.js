'use strict'

var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/g');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt');

var config = {
    wechat: {
        "appID": 'wxa584c706e210b4b9',
        "appSecret": 'a10dbc78ec075df6d2c2250f786d6d4b',
        "token": '0987654321scj',
        // "prefix": "https://api.weixin.qq.com/cgi-bin/",
        // "mpPrefix": "https://mp.weixin.qq.com/cgi-bin/",
        "getAccessToken": function() {
            return util.readFileAsync(wechat_file);
        },
        "saveAccessToken": function(data) {
            data = JSON.stringify(data);
            return util.writeFileAsync(wechat_file, data);
        }
    }
}

var app = new Koa();

app.use(wechat(config.wechat));
app.listen(80); //终端输入：node --harmony app.js
console.log('listening: 80');
