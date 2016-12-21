'use strict'

var config = require('./config');
var Wechat = require('./wechat/wechat');
var wechatApi = new Wechat(config.wechat);

exports.reply = function *(next) {
    var message = this.weixin;

    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫二维码进来：' + message.EventKey + ' ' + message.ticket + "\n");
            }


            //this.body={"type":"subscribe"};
            this.body = '您好，欢迎你订阅了pennyeew微信公众号' + ' 消息ID：' + message.MsgId + "\n";
        } else if (message.Event === 'unsubscribe') {
            console.log('取消关注啦！' + "\n");
            this.body = '关注取消--';
        } else if (message.Event === 'LOCATION') {
            this.body = '您上报的位置是：' + message.latitude + '/' + message.Longitude + '---' + message.Precision + "\n";
        } else if (message.Event === 'CLICK') {
            this.body = '您点击了菜单：' + message.EventKey + "\n";
        } else if (message.Event === 'SCAN') {
            console.log('关注后扫二维码' + message.EventKey + '  ' + message.Ticket + "\n");
            this.body = '看到你扫二维码了' + "\n";
        } else if (message.Event === 'VIEW') {
            this.body = '您点击了菜单中的链接：' + message.EventKey + "\n";
        }
    } else if (message.MsgType === 'text') {
        var content = message.Content;
        var reply = '额，你说的 ' + message.Content + ' 太复杂了';

        if (content === '1') {
            reply = '第一种方法看书';
        } else if (content === '2') {
            reply = '第二种方法喝茶';
        } else if (content === '3') {
            reply = '第三种方法晒太阳';
        } else if (content === '4') {
            reply = [{
                "title": '生活多喜乐',
                "description": '花鸟鱼虫，山河树木',
                "picUrl": 'http://oiler.manami.com.cn/img/1.jpg',
                "url": 'http://oiler.manami.com.cn/'
            }, {
                "title": '技术生活',
                "description": 'IT改变什么',
                "picUrl": 'http://oiler.manami.com.cn/img/2.jpg',
                "url": 'http://www.manami.com.cn'
            }];
        } else if (content === '5') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg');

            reply = {
                "type": 'image',
                "mediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '6') {
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/2.jpg');

            reply = {
                "type": 'video',
                "title": "回复一个MP4视频",
                "description": "这里只是一个小饰品，哈哈！",
                "mediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '7') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg');

            reply = {
                "type": 'music',
                "title": "回复一个音乐，听音乐",
                "description": "来放松一下，呵呵！",
                "MusicUrl": 'url------  ',
                //"HQMusicUrl":'',
                "ThumbMediaId": data.media_id
            }

            console.log(reply);
        }

        this.body = reply;
    }

    yield next
}
