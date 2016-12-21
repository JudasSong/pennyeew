'use strict'

var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt');

var config = {
    wechat: {
        "appID": 'wxa584c706e210b4b9',
        "appSecret": 'a10dbc78ec075df6d2c2250f786d6d4b',
        "token": 'pennyohknogorccscj',
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

module.exports = config;
