'use strict'

var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt');

var config = {
    wechat: {
        "appID": 'wx4185bb0b486d6860',
        "appSecret": '1fe095cd2af7d6db464e45b15f5f718f',
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

//正式的个人公众号
//"appID": 'wxa584c706e210b4b9',
//    "appSecret": 'a10dbc78ec075df6d2c2250f786d6d4b',

//测试微信公众号：gh_8d55730e850c

//程序 1-1-3-5-7-3-5-7  用户请求后 1-2-url-1-2-url
module.exports = config;
