'use strict'

exports.reply = function*(next) {
    var message = this.weixin;

    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫二维码进来：' + message.EventKey + ' ' + message.ticket);
            }

            this.body = '好好，你订阅了pennyeew微信公众号' + ' 消息ID：' + message.MsgId;
        } else if (message.Event === 'unsubscribe') {
            console.log('取消关注啦！');
            this.body = '';
        } else if (message.Event === 'LOCATION') {
            this.body = '您上报的位置是：' + message.latitude + '/' + message.Longitude + '---' + message.Precision;
        } else if (message.Event === 'CLICK') {
            this.body = '您点击了菜单：' + message.EventKey;
        } else if (message.Event === 'SCAN') {
            console.log('关注后扫二维码' + message.EventKey + '  ' + message.Ticket);
            this.body = '看到你扫二维码了';
        } else if (message.Event === 'VIEW') {
            this.body = '您点击了菜单中的链接：' + message.EventKey;
        } else if (message.MsgType === 'text') {
            var content = message.Content;
            var reply = '额，你说的 ' + message.content + ' 太复杂了'；

            if (content === '1') {
                reply = '第一种方法看书';
            } else if (content === '1') {
                reply = '第二种方法喝茶';
            } else if (content === '3') {
                reply = '第二种方法晒太阳';
            } else if (content === '4') {
                reply = [{
                    title: '生活多喜乐',
                    description: '花鸟鱼虫，山河树木',
                    picUrl: 'http://oiler.manami.com.cn/img/1.jpg',
                    url: 'http://oiler.manami.com.cn/'
                }, {
                    title: '技术生活',
                    description: 'IT改变什么',
                    picUrl: 'http://oiler.manami.com.cn/img/2.jpg',
                    url: 'http://manami.com.cn/'
                }];
            }

            this.body = reply;
        } else {

        }

        yield next;
    }
}
