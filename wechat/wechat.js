'use strict'

var Promise = require('bluebird');
var _ = require('lodash');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: {
        upload: prefix + 'media/upload?',
        fetch: prefix + 'media/get?'
    },
    permanent: {
        upload: prefix + 'material/add_material?',
        fetch: prefix + 'material/get_material?',
        uploadNews: prefix + 'material/add_news?',
        uploadNewsPic: prefix + 'media/uploadimg?',
        del: prefix + 'material/del_material?',
        update: prefix + 'material/update_news?',
        count: prefix + 'material/get_materialcount?',
        batch: prefix + 'material/batchget_material?'
    },
    group: {
        create: prefix + 'tags/create?',
        delete: prefix + 'tags/delete?',
        fetch: prefix + 'tags/get?',   //获取
        check: prefix + 'tags/getidlist?',  //接口不明确  tags/getidlist?  /user/tag/get?
        update: prefix + 'tags/update?',
        move: prefix + 'tags/members/getblacklist?',
        batchupdate: prefix + 'tags/members/batchtagging?',
        del: prefix + 'tags/members/batchuntagging?'
    }
}

function Wechat(opts) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;

    this.fetchAccessToken();
}

Wechat.prototype.isValidAccessToken = function (data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false;
    }

    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());

    if (now < expires_in) {
        return true;
    } else {
        return false;
    }
}

Wechat.prototype.updateAccessToken = function () {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

    return new Promise(function (resolve, reject) {
        request({"url": url, "json": true}).then(function (response) {
            var data = response["body"];
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000;

            data.expires_in = expires_in;

            resolve(data);
        });
    });
}

Wechat.prototype.uploadMaterial = function (type, material, permanent) {
    var that = this;
    var form = {};
    var uploadUrl = api.temporary.upload;

    if (permanent) {
        uploadUrl = api.permanent.upload;

        _.extend(form, permanent);
    }

    if (type === 'pic') {
        uploadUrl = api.permanent.uploadNewsPic;
    }

    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews;
        form = material;
    } else {
        form.media = fs.createReadStream(material);
    }

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = uploadUrl + 'access_token=' + data.access_token;

                if (!permanent) {
                    url += '&type=' + type;
                } else {
                    form.access_token = data.access_token;
                }

                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                }

                if (type === 'news') {
                    options.body = form;
                } else {
                    options.formData = form;
                }

                console.log("-----url：" + url + "\n");

                //return;{"method": "POST", "url": url, "formData": form, "json": true}
                request(options).then(function (response) {
                        var _data = response[1];

                        //console.log(response);
                        //return;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('Upload material fails');
                        }
                    })
                    .catch(function (err) {
                        reject(err);
                    })
            })
    });
}

Wechat.prototype.fetchMaterial = function (mediaId, type, permanent) {
    var that = this;
    var fetchUrl = api.temporary.fetch;

    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = fetchUrl + 'access_token=' + data.access_token;
                var options = {
                    "method": "POST",
                    "url": url,
                    "json": true
                };
                var form = {};

                if (permanent) {
                    form.media_id = mediaId;
                    form.access_token = data.access_token;

                    options.body = form;
                } else {
                    if (type === 'video') {
                        url = url.replace("https://", "http://")
                    }
                    url += '&media_id=' + mediaId;
                }

                if (type === 'news' || type === 'video') {
                    request(options).then(function (response) {
                            var _data = response[1];

                            if (_data) {
                                resolve(_data);
                            } else {
                                throw new Error('fetch material fails');
                            }
                        })
                        .catch(function (err) {
                            reject(err);
                        })
                } else {
                    resolve(url);
                }


            })
    });
}

Wechat.prototype.deleteMaterial = function (mediaId) {
    var that = this;
    var form = {
        media_id: mediaId
    };

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;

                request({"method": "POST", "url": url, "body": form, "json": true}).then(function (response) {
                        var _data = response[1];

                        //console.log(response);
                        //return;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('Delete material fails');
                        }
                    })
                    .catch(function (err) {
                        reject(err);
                    })
            })
    });
}

Wechat.prototype.updateMaterial = function (mediaId, news) {
    var that = this;
    var form = {
        media_id: mediaId
    };

    _.extend(form, news);

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;

                request({"method": "POST", "url": url, "body": form, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('update material fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.countMaterial = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.permanent.count + 'access_token=' + data.access_token;

                request({"method": "GET", "url": url, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('count material fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.batchMaterial = function (options) {
    var that = this;

    options.type = options.type || 'image';
    options.offset = options.offset || 0;
    options.count = options.count || 1;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.permanent.batch + 'access_token=' + data.access_token;

                request({"method": "POST", "url": url, "body": options, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('batch material fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}


/* 用户标签管理 */
/*创建标签*/
Wechat.prototype.createGroup = function (name) {
    var that = this;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.group.create + 'access_token=' + data.access_token;
                var form = {
                    "tag": {
                        "name": name//标签名
                    }
                }

                request({"method": "POST", "url": url, "body": form, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('create group fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}

/*获取标签*/
Wechat.prototype.fetchGroup = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.group.fetch + 'access_token=' + data.access_token;

                //此处get请求
                request({"url": url, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('fetch group fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}

/* 查询用户所在分组 接口不明确 */
Wechat.prototype.checkGroup = function (openid) {
    var that = this;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.group.check + 'access_token=' + data.access_token;
                var form = {
                 "openid": openid
                 }

                /*var form = {
                    "tagid": tagid,
                    "next_openid": openid//第一个拉取的OPENID，不填默认从头开始拉取
                }*/

                request({"method": "POST", "url": url, "body": form, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('check group fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.updateGroup = function (id, name) {
    var that = this;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.group.update + 'access_token=' + data.access_token;
                var form = {
                    "tag": {
                        "id": id,  //分组id(标签id)
                        "name": name
                    }
                }

                request({"method": "POST", "url": url, "body": form, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('update group fails');
                    }
                }).catch(function (err) {
                    reject(err);
                })
            })
    });
}

//批量移动分组和单个移动分组合并到一个方法，根据openid判断数组
Wechat.prototype.moveGroup = function (openIds, to) {
    var that = this;

    return new Promise(function (resolve, reject) {
        that
            .fetchAccessToken()
            .then(function (data) {
                var url;
                var form = {
                    "tagid": to
                }

                if (_.isArray(openIds)) {
                    url = api.group.batchupdate + 'access_token=' + data.access_token;
                    form.openid_list = openIds;
                } else {
                    url = api.group.move + 'access_token=' + data.access_token;
                    form.openid = openIds;
                }

                request({"method": "POST", "url": url, "body": form, "json": true}).then(function (response) {
                    var _data = response[1];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('Move material fails');
                    }
                })
            })
    });
}

Wechat.prototype.fetchAccessToken = function (data) {
    debugger;
    var that = this;
    //console.log("1、that "+JSON.stringify(that));

    if (this.access_token && this.expires_in) {
        if (this.isValidAccessToken(this)) {

            //console.log("2、return "+JSON.stringify(Promise.resolve(this)));
            return Promise.resolve(this);
        }
    }

    this.getAccessToken()
        .then(function (data) {
            try {

                //console.log("3、try data "+data);
                data = JSON.parse(data);
            } catch (e) {

                //console.log("4、 catch "+that.updateAccessToken());
                return that.updateAccessToken();
            }

            if (that.isValidAccessToken(data)) {

                //console.log("5、 isValidAccessToken "+JSON.stringify(Promise.resolve(data)));
                return Promise.resolve(data);
            } else {

                //console.log("6、 isValidAccessToken else "+that.updateAccessToken());
                return that.updateAccessToken();
            }
        })
        .then(function (data) {
            that.access_token = data.access_token;
            that.expires_in = data.expires_in;

            that.saveAccessToken(data);

            //console.log("7、last "+JSON.stringify(Promise.resolve(data)));
            return Promise.resolve(data);
        })
}

Wechat.prototype.reply = function () {
    var content = this.body;
    var message = this.weixin;
    var xml = util.tpl(content, message);  //经模板处理

    //console.log("content：" + content+"\n");
    //console.log("message：" + message+"\n");
    //console.log("xml：" + xml+"\n");

    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
}

module.exports = Wechat;
