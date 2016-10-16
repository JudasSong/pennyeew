'use strict'

// var utils = {};
var sha1 = require('sha1');
var getRawBody = require('raw-body');
var Wechat = require('./wechat');
var util = require('./util');

//检查微信签名认证中间件 
module.exports = function(opts, handler) {
    var wechat = new Wechat(opts);

    return function*(next) {
        // console.log(this.method);
        var that = this;

        var token = opts.token;
        var signature = this.query.signature;
        var timestamp = this.query.timestamp;
        var nonce = this.query.nonce;
        var echostr = this.query.echostr;

        // 参数         描述
        // signature    微信加密签名，signature结合了开发者填写的token参数和请求中的timestamp参数、nonce参数。
        // timestamp    时间戳
        // nonce        随机数
        // echostr      随机字符串

        var str = [token, timestamp, nonce].sort().join('');
        var sha = sha1(str);

        // 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
        // 如果匹配,返回echoster , 不匹配则返回error
        if (this.method == 'GET') {
            if (sha === signature) {
                this.body = echostr;
            } else {
                this.body = 'error';
            }
        } else if (this.method == 'POST') {
            if (sha != signature) {
                this.body = 'error';
                return false;
            }

            var data = yield getRawBody(this.req, {
                length: this.length,
                limit: '1mb',
                encoding: this.charset
            });

            var content = yield util.parseXMLAsync(data);
            var message = util.formatMessage(content.xml);
            // console.log(data.toString());
            // console.log(message);

            this.weixin = message;

            handler.call(this, next);

            wechat.reply.call(this);
        }
    }
};


//检查微信签名认证中间件  
// utils.sign = function(config) {
//     return function*(req, res, next) {
//         config = config || {};
//         console.log(req);
//         return false;
//         var q = req.query;

//         console.log(JSON.stringify(q));
//         var token = config.token;
//         var signature = q.signature; //微信加密签名  
//         var nonce = q.nonce; //随机数  
//         var timestamp = q.timestamp; //时间戳  
//         var echostr = q.echostr; //随机字符串  

//         var str = [token, timestamp, nonce].sort().join('');
//         var sha = sha1(str);

//         if (req.method == 'GET') {
//             if (sha == signature) {
//                 res.send(echostr + '')
//             } else {
//                 res.send('err');
//             }
//         } else if (req.method == 'POST') {
//             if (sha != signature) {
//                 return;
//             }
//             next();
//         }
//     }
// };

// module.exports = utils.sign;
