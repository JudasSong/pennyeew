'use strict'

var Koa = require('koa');
var path = require('path');
var wechat = require('./wechat/g');
var util = require('./libs/util');
var config = require('./config');
var reply = require('./wx/reply');
var Wechat = require('./wechat/wechat');
var wechat_file = path.join(__dirname, './config/wechat.txt');

var app = new Koa();
var ejs = require('ejs');
var crypto = require('crypto');
var heredoc = require('heredoc');

var tpl = heredoc(function() {
    /*
         <!DOCTYPE html>
         <html>
         <head>
             <meta charset="utf-8">
             <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
             <meta name="viewport" content="width=device-width,user-scalable=no,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0">
             <title>搜电影</title>
             <meta name="description" content="">
             <meta name="keywords" content="">
             <link href="" rel="stylesheet">
         </head>
         <body>
             <h1>点击标题，开始录音翻译</h1>
             <p id="title"></p>
             <div id="year"></div>
             <div id="director"></div>
             <div id="poster"></div>
             <script type="text/javascript" src="http://cdn.bootcss.com/zepto/1.0rc1/zepto.min.js"></script>
             <script type="text/javascript" src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
             <script type="text/javascript">
                wx.config({
                    debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: 'wx4185bb0b486d6860', // 必填，公众号的唯一标识
                    timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
                    nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
                    signature: '<%= signature %>', // 必填，签名，见附录1
                    jsApiList: [
                            'onMenuShareTimeline',
                            'onMenuShareAppMessage',
                            'onMenuShareQQ',
                            'onMenuShareWeibo',
                            'onMenuShareQZone', 
                            'previewImage',
                            'startRecord',
                            'stopRecord',
                            'onVoiceRecordEnd',
                            'translateVoice'
                        ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                });

                wx.ready(function(){
                    wx.checkJsApi({
                        jsApiList: ['onVoiceRecordEnd'],
                        success: function(res) {
                            console.log(res);
                        }
                    });

                    var shareContent={
                            title: '搜索搜狗搜狐', 
                            desc: '我搜出来了啥!', 
                            link: 'https://developers.douban.com/wiki/?title=movie_v2#search', 
                            imgUrl: 'http://static.mukewang.com/static/img/common/logo.png?t=1', 
                            type: 'link',
                            dataUrl: '',
                            success: function() { 
                                window.alert("分享成功");
                            },
                            cancel: function() { 
                                window.alert("分享失败");
                            }
                        };
                    wx.onMenuShareAppMessage(shareContent); 

                    var slides={};
                    $("#poster").on("tap",function(){
                        wx.previewImage(slides);
                    });

                    var isRecording=false;
                    $("h1").on("tap",function(){

                        if(!isRecording){
                            isRecording=true;

                            wx.startRecord({
                                "cancel":function(){
                                    window.alert("那就不能使用了哦！");
                                }
                            });

                            return;
                        }

                        isRecording=false;
                        wx.stopRecord({
                            success: function (res) {
                                var localId = res.localId;

                                wx.translateVoice({
                                    localId: localId, 
                                    isShowProgressTips: 1, 
                                    success: function (res) {
                                        var result=res.translateResult;
                                        window.alert(res.translateResult);

                                        $.ajax({
                                            "type":"GET",
                                            "url":"https://api.douban.com/v2/movie/search?q="+result,
                                            "dataType":"jsonp",
                                            "jsonp":"callback",
                                            "success":function(data){
                                                var subject=data.subjects[0];

                                                $("#title").html(subject.title);
                                                $("#year").html(subject.year);
                                                $("#director").html(subject.directors[0].name);
                                                $("#poster").html('<img src="'+ subject.images.large +'"/>');

                                                shareContent={
                                                    title: subject.title, 
                                                    desc: '我搜出来了'+subject.title, 
                                                    link: 'https://developers.douban.com/wiki/?title=movie_v2#search', 
                                                    imgUrl: subject.images.large, 
                                                    type: 'link',
                                                    dataUrl: '',
                                                    success: function() { 
                                                        window.alert("分享成功");
                                                    },
                                                    cancel: function() { 
                                                        window.alert("分享失败");
                                                    }
                                                };
                                                wx.onMenuShareAppMessage(shareContent);

                                                slides={
                                                    current: subject.images.large,
                                                    urls: [subject.images.large]
                                                };
                                                data.subjects.forEach(function(item){
                                                    slides.urls.push(item.images.large);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    })
                });
            </script>
         </body>
         </html>
         */
});

var createNonce = function() {
    return Math.random().toString(36).substr(2, 15);
};

var createTimestamp = function() {
    return parseInt(new Date().getTime() / 1000, 10) + '';
}

var _sign = function(noncestr, ticket, timestamp, url) {
    var params = [
        'noncestr=' + noncestr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url
    ];
    var str = params.sort().join('&');
    var shasum = crypto.createHash('sha1');

    shasum.update(str);

    return shasum.digest('hex');
}

function sign(ticket, url) {
    var noncestr = createNonce();
    var timestamp = createTimestamp();
    var signature = _sign(noncestr, ticket, timestamp, url);

    return {
        noncestr: noncestr,
        timestamp: timestamp,
        signature: signature
    }
}

app.use(function*(next) {
    if (this.url.indexOf('/movie') > -1) {
        var wechatApi = new Wechat(config.wechat);
        var data = yield wechatApi.fetchAccessToken();
        var access_token = data.access_token;
        var ticketData = yield wechatApi.fetchTicket(access_token);
        var ticket = ticketData.ticket;
        var url = this.href.replace(":8000", "");
        console.log("ticket：" + ticket);
        console.log("url：" + url);
        var params = sign(ticket, url);

        console.log(params);
        this.body = ejs.render(tpl, params);

        return next
    }

    yield next
});

app.use(wechat(config.wechat, reply.reply));
app.listen(1234); //终端输入：node --harmony app.js
console.log('listening: 1234');
