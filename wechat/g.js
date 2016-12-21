'use strict'

var sha1 = require('sha1');
var getRawBody = require('raw-body');
var Wechat = require('./wechat');
var util = require('./util');

//检查微信签名认证中间件 
module.exports = function (opts, handler) {
    var wechat = new Wechat(opts);

    return function *(next) {
        // console.log(this);
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
                this.body = echostr + '';
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
            //console.log("反推："+JSON.stringify(message));
            this.weixin = message;

            //if (message.MsgType === 'event') {
            //    if (message.Event === 'subscribe') {
            //        var now = new Date().getTime();
            //
            //        that.status = 200;
            //        that.type = 'application/xml';
            //        that.body = "<xml><ToUserName><![CDATA[" + message.FromUserName + "]]></ToUserName><FromUserName><![CDATA[" + message.ToUserName + "]]></FromUserName><CreateTime>" + now + "</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[哪嗒]]></Content></xml>";
            //
            //        console.log(that);
            //        return;
            //    }
            //}


            yield handler.call(this, next);  //回复给微信的内容  next空对象
            wechat.reply.call(this);  //处理调用wechat.js里的wechat.reply方法
        }
    }
};
