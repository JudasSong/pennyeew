'use strict'

var path = require('path');
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

            this.body = '您好，欢迎你订阅了pennyeew微信公众号！' + "\n";
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

            //console.log();
        } else if (content === '5') { //5、6、7无接口权限--临时素材  __dirname + '/2.jpg'
            var picUrl = path.join(__dirname, './2.jpg');
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg');

            reply = {
                "type": 'image',
                "mediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '6') {
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/yangxue.mp4');

            reply = {
                "type": 'video',
                "title": "临时素材 回复一个MP4视频",
                "description": "这里只是一个小饰品，哈哈！",
                "mediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '7') {
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg');

            reply = {
                "type": 'music',
                "title": "临时素材 回复一个音乐，听音乐",
                "description": "来放松一下，呵呵！",
                "musicUrl": 'http://www.manami.com.cn/img/god.mp3',
                //"HQMusicUrl":'',
                "thumbMediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '8') { //
            var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg', {type: 'image'});

            reply = {
                "type": 'image',
                "mediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '9') { //
            var data = yield wechatApi.uploadMaterial('video', __dirname + '/yangxue.mp4', {
                type: 'video',
                description: '{"title":"Really a nice place","introduction":"I have a dream"}'
            });

            console.log("永久素材的视频：" + data + "\n");

            reply = {
                "type": 'video',
                "title": "永久素材 回复一个MP4视频",
                "description": "这里只是一个小饰品，哈哈！",
                "mediaId": data.media_id
            }

            console.log(reply);
        } else if (content === '10') { //
            var picData = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg', {});

            var media = {
                "articles": [{
                    "title": "蜡笔小新",
                    "thumb_media_id": picData.media_id,
                    "author": "Scott",
                    "digest": "臼井仪人创作的漫画作品",
                    "show_cover_pic": 1,
                    "content": "《蜡笔小新》是由臼井仪人创作的漫画，1990年8月，在《weekly漫画action》上开始连载。1992年，根据漫画改编的同名动画在朝日电视台播出。",
                    "content_source_url": "http://www.manami.com.cn"
                }, {
                    "title": "名侦探柯南",
                    "thumb_media_id": picData.media_id,
                    "author": "Scott",
                    "digest": "青山刚昌创作的侦探漫画",
                    "show_cover_pic": 1,
                    "content": "《名侦探柯南》是根据日本漫画家青山刚昌创作的侦探漫画《名侦探柯南》改编的同名推理动画作品系列。其中电视动画由V1 Studio制作，于1996年1月8日开始在日本读卖电视台播放，至今仍在播出。",
                    "content_source_url": "https://github.com"
                }]
            };

            data = yield wechatApi.uploadMaterial('news', media, {});
            data = yield wechatApi.fetchMaterial(data.media_id, 'news', {});

            console.log("data：" + JSON.stringify(data) + "\n");

            var items = data.news_item;
            var news = [];

            items.forEach(function (item) {
                news.push({
                    "title": item.title,
                    "description": item.digest,
                    "picUrl": picData.url,
                    "url": item.url
                })
            });

            reply = news;
            console.log(reply);
        } else if (content === '11') { //
            var counts = yield wechatApi.countMaterial();

            console.log(JSON.stringify(counts));
            var results = yield [
                wechatApi.batchMaterial({
                    type: 'image',
                    "offset": 0,
                    "count": 10
                }), wechatApi.batchMaterial({
                    type: 'video',
                    "offset": 0,
                    "count": 10
                }), wechatApi.batchMaterial({
                    type: 'voice',
                    "offset": 0,
                    "count": 10
                }), wechatApi.batchMaterial({
                    type: 'news',
                    "offset": 0,
                    "count": 10
                })];

            console.log(JSON.stringify(results));
            reply = '11';
        } else if (content === '12') {
            //var group = yield wechatApi.createGroup('family');
            //console.log("新分组 family");
            //console.log(group);
            //
            //var groups = yield wechatApi.fetchGroups();
            //console.log("加了 新分组 分组列表");
            //console.log(groups);
            //
            //var checkGroup = yield wechatApi.checkGroup(message.FromUserName);
            //console.log("查看自己的分组");
            //console.log(checkGroup);
            //
            //var moveGroup = yield wechatApi.moveGroup(message.FromUserName, 2);
            //console.log("移动到 2");
            //console.log(moveGroup);
            //
            //var moveGroupEnd = yield wechatApi.fetchGroups();
            //console.log("移动后的分组列表");
            //console.log(moveGroupEnd);

            var batchMoveGroup = yield wechatApi.moveGroup([message.FromUserName], 101);
            console.log("批量移动到 101");
            console.log(batchMoveGroup);

            var batchMoveGroupEnd = yield wechatApi.fetchGroups();
            console.log("批量移动后 分组列表");
            console.log(batchMoveGroupEnd);

            //var updateGroup = yield wechatApi.updateGroup(100,'wechat100');
            //console.log("100 wechat改名wechat100");
            //console.log(updateGroup);

            //var updateName = yield wechatApi.fetchGroups();
            //console.log("wechat改名后 分组列表");
            //console.log(updateName);
            //
            //var deleteGroup = yield wechatApi.deleteGroup(100);
            //console.log("删除 100");
            //console.log(deleteGroup);
            //
            //var deleteGroupEnd = yield wechatApi.fetchGroups();
            //console.log("删除wechat100后 分组列表");
            //console.log(deleteGroupEnd);

            reply = "Group Done!";
        } else if (content === '13') {
            var user = yield wechatApi.fetchUsers(message.FromUserName, "en");
            console.log(user);

            var openIds = [{
                openid: message.FromUserName,
                lang: "en"   //zh_CN
            }
            ];

            var users = yield wechatApi.fetchUsers(openIds);
            console.log(users);

            reply = JSON.stringify(user);
        } else if (content === '14') {
            var userList = yield wechatApi.listUsers();
            console.log(userList);

            reply = userList.total;
        } else if (content === '15') {
            var mpnews = {
                media_id: "Vt_UZuYPXrTK4KP5niW_nNFEzLVMO0DyP1UnL2x9kj4"
            }
            var msgData = yield wechatApi.sendByGroup('mpnews', mpnews, 101);
            console.log(msgData);

            reply = "Yeah!";
        }

        this.body = reply;
    }

    yield next
}
