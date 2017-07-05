'use strict'

var Promise = require('bluebird');
var _ = require('lodash');
var request = Promise.promisify(require('request'));
var util = require('./util');
var fs = require('fs');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
var semanticUrl = 'https://api.weixin.qq.com/semantic/semproxy/search?';
var api = {
    semanticUrl: semanticUrl,
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
        create: prefix + 'groups/create?',
        delete: prefix + 'groups/delete?',
        fetch: prefix + 'groups/get?', //获取
        check: prefix + 'groups/getid?', //查询用户所在分组
        update: prefix + 'groups/update?',
        move: prefix + 'groups/members/update?', //移动用户分组
        batchupdate: prefix + 'groups/members/batchupdate?' //批量移动用户分组
    },
    user: {
        remark: prefix + "user/info/updateremark?",
        fetch: prefix + "user/info?",
        batchFetch: prefix + "user/info/batchget?",
        list: prefix + "user/get?"
    },
    mass: {
        group: prefix + "message/mass/sendall?",
        openId: prefix + "message/mass/send?",
        delete: prefix + "message/mass/delete?",
        preview: prefix + "message/mass/preview",
        check: prefix + "message/mass/get?"
    },
    menu: {
        create: prefix + "menu/create?",
        get: prefix + "menu/get?",
        delete: prefix + "menu/delete?",
        current: prefix + "get_current_selfmenu_info?"
    },
    qrcode: {
        create: prefix + "qrcode/create?",
        show: mpPrefix + 'showqrcode?'
    },
    shortUrl: {
        create: prefix + "shorturl?"
    },
    ticket: {
        get: prefix + 'ticket/getticket?'
    }
}

function Wechat(opts) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    this.getTicket = opts.getTicket;
    this.saveTicket = opts.saveTicket;

    this.fetchAccessToken();
}

Wechat.prototype.fetchAccessToken = function(data) {
    //debugger;
    var that = this;
    //console.log("1、that "+JSON.stringify(that));

    //if (this.access_token && this.expires_in) {
    //    if (this.isValidAccessToken(this)) {
    //
    //        //console.log("2、return "+JSON.stringify(Promise.resolve(this)));
    //        return Promise.resolve(this);
    //    }
    //}

    return this.getAccessToken()
        .then(function(data) {
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
        .then(function(data) {
            //that.access_token = data.access_token;
            //that.expires_in = data.expires_in;

            that.saveAccessToken(data);

            //console.log("7、last "+JSON.stringify(Promise.resolve(data)));
            return Promise.resolve(data);
        })
}

Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

    return new Promise(function(resolve, reject) {
        request({ "url": url, "json": true }).then(function(response) {
            var data = response["body"];
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000;

            data.expires_in = expires_in;

            resolve(data);
        });
    });
}

Wechat.prototype.isValidAccessToken = function(data) {
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

//js-sdk 票据
Wechat.prototype.fetchTicket = function(access_token) {
    var that = this;

    return this.getTicket()
        .then(function(data) {
            try {

                //console.log("3、try data "+data);
                data = JSON.parse(data);
            } catch (e) {

                //console.log("4、 catch "+that.updateAccessToken());
                return that.updateTicket(access_token);
            }

            if (that.isValidTicket(data)) {

                //console.log("5、 isValidAccessToken "+JSON.stringify(Promise.resolve(data)));
                return Promise.resolve(data);
            } else {

                //console.log("6、 isValidAccessToken else "+that.updateAccessToken());
                return that.updateTicket(access_token);
            }
        })
        .then(function(data) {
            that.saveTicket(data);

            //console.log("7、last "+JSON.stringify(Promise.resolve(data)));
            return Promise.resolve(data);
        })
}

Wechat.prototype.updateTicket = function(access_token) {
    var url = api.ticket.get + '&access_token=' + access_token + '&type=jsapi';

    return new Promise(function(resolve, reject) {
        request({ "url": url, "json": true }).then(function(response) {
            var data = response["body"];
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000;

            data.expires_in = expires_in;

            resolve(data);
        });
    });
}

Wechat.prototype.isValidTicket = function(data) {
    if (!data || !data.ticket || !data.expires_in) {
        return false;
    }

    var ticket = data.ticket;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());

    if (ticket && now < expires_in) {
        return true;
    } else {
        return false;
    }
}

Wechat.prototype.uploadMaterial = function(type, material, permanent) {
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

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
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

                //console.log("-----options：" + JSON.stringify(options) + "\n");

                //return;{"method": "POST", "url": url, "formData": form, "json": true}
                request(options)
                    .then(function(response) {
                        var _data = response["body"];

                        //console.log(response);
                        //return;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('Upload material fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err);
                    })
            })
    });
}

Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var that = this;
    var fetchUrl = api.temporary.fetch;

    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
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
                    request(options).then(function(response) {
                            var _data = response["body"];

                            if (_data) {
                                resolve(_data);
                            } else {
                                throw new Error('fetch material fails');
                            }
                        })
                        .catch(function(err) {
                            reject(err);
                        })
                } else {
                    resolve(url);
                }

                //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                //var url = fetchUrl + 'access_token=' + data.access_token + "&media_id=" + mediaId;
                //var form = {
                //    media_id: mediaId,
                //    access_token: data.access_token
                //}
                //
                //request({"method": "POST", "url": url, "formData": form, "json": true}).
                //    then(function (response) {
                //        var _data = response["body"];
                //
                //        if (_data) {
                //            resolve(_data);
                //        } else {
                //            throw new Error('fetch material fails');
                //        }
                //    })
                //    .catch(function (err) {
                //        reject(err);
                //    })
                //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            })
    });
}

Wechat.prototype.deleteMaterial = function(mediaId) {
    var that = this;
    var form = {
        media_id: mediaId
    };

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                        var _data = response["body"];

                        //console.log(response);
                        //return;
                        if (_data) {
                            resolve(_data);
                        } else {
                            throw new Error('Delete material fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err);
                    })
            })
    });
}

Wechat.prototype.updateMaterial = function(mediaId, news) {
    var that = this;
    var form = {
        media_id: mediaId
    };

    _.extend(form, news);

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('update material fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.countMaterial = function() {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.count + 'access_token=' + data.access_token;

                request({ "method": "GET", "url": url, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('count material fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.batchMaterial = function(options) {
    var that = this;

    options.type = options.type || 'image';
    options.offset = options.offset || 0;
    options.count = options.count || 1;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.batch + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": options, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('batch material fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}


/* 用户标签管理 */
/*创建用户分组*/
Wechat.prototype.createGroup = function(name) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.create + 'access_token=' + data.access_token;
                var form = {
                    "group": {
                        "name": name //标签名
                    }
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('create group fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

/*获取用户分组*/
Wechat.prototype.fetchGroups = function() {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.fetch + 'access_token=' + data.access_token;

                //此处get请求
                request({ "url": url, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('fetch group fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

/* 查询用户所在分组 */
Wechat.prototype.checkGroup = function(openId) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.check + 'access_token=' + data.access_token;
                var form = {
                    "openid": openId
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('check group fails  查询用户所在分组');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//更新分组
Wechat.prototype.updateGroup = function(id, name) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.update + 'access_token=' + data.access_token;
                var form = {
                    "group": {
                        "id": id,
                        "name": name
                    }
                };

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('update group fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//批量移动分组和单个移动分组合并到一个方法，根据openid判断数组
Wechat.prototype.moveGroup = function(openIds, to) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url;
                var form = {
                    "to_groupid": to
                }

                if (_.isArray(openIds)) {
                    url = api.group.batchupdate + 'access_token=' + data.access_token;
                    form.openid_list = openIds;
                } else {
                    url = api.group.move + 'access_token=' + data.access_token;
                    form.openid = openIds;
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('Move group fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//删除分组
Wechat.prototype.deleteGroup = function(id) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.group.delete + 'access_token=' + data.access_token;;
                var form = {
                    "group": {
                        "id": id
                    }
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('delete group fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//设置用户备注名
Wechat.prototype.remarkUser = function(openId, remark) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.user.remark + 'access_token=' + data.access_token;
                var form = {
                    "openid": openId,
                    "remark": remark
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('remark User fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//获取用户基本信息 单个与批量
Wechat.prototype.fetchUsers = function(openIds, lang) {
    var that = this;
    lang = lang || "zh_CN";

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var options = {
                    "json": true
                }

                if (_.isArray(openIds)) {
                    options.url = api.user.batchFetch + 'access_token=' + data.access_token;
                    options.body = {
                        "user_list": openIds
                    }
                    options.method = "POST";
                } else {
                    options.url = api.user.fetch + 'access_token=' + data.access_token + "&openid=" + openIds + "&lang=" + lang;
                    options.method = "GET";
                }

                request(options).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('fetch User fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//获取用户列表
Wechat.prototype.listUsers = function(openId) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.user.list + 'access_token=' + data.access_token;

                if (openId) {
                    url += "&next_openid=" + openId;
                }

                request({ "method": "GET", "url": url, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('list User fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//根据分组进行群发
Wechat.prototype.sendByGroup = function(type, message, groupId) {
    var that = this;
    var msg = {
        "filter": {},
        "msgtype": type
    };
    //msg["msgtype"] = message;
    msg[type] = message;

    if (!groupId) {
        msg.filter.is_to_all = true;
    } else {
        msg.filter = {
            "is_to_all": false,
            "group_id": groupId
        }
    }

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.group + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": msg, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('sendByGroup fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//根据OpenID列表群发
Wechat.prototype.sendByOpenId = function(type, message, openIds) {
    var that = this;
    var msg = {
        "msgtype": type,
        "touser": openIds
    };
    msg[type] = message;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.openId + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": msg, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('sendByOpenId fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//删除群发
Wechat.prototype.deleteMass = function(msgId) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.delete + 'access_token=' + data.access_token;
                var form = {
                    msg_id: msgId
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('deleteMass fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//预览接口
Wechat.prototype.previewMass = function(type, message, openId) {
    var that = this;
    var msg = {
        "msgtype": type,
        "touser": openId
    };
    msg[type] = message;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.preview + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": msg, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('previewMass fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//查询群发消息发送状态
Wechat.prototype.checkMass = function(msgId) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.check + 'access_token=' + data.access_token;
                var form = {
                    msg_id: msgId
                }

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('checkMass fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//自定义菜单创建
Wechat.prototype.createMenu = function(menu) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.create + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": menu, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('createMenu fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//自定义菜单查询
Wechat.prototype.getMenu = function() {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.get + 'access_token=' + data.access_token;

                request({ "url": url, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('getMenu fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//自定义菜单删除
Wechat.prototype.deleteMenu = function() {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.delete + 'access_token=' + data.access_token;

                request({ "url": url, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('deleteMenu fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//获取自定义菜单配置接口
Wechat.prototype.getCurrentMenu = function() {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.current + 'access_token=' + data.access_token;

                request({ "url": url, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('getCurrentMenu fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//生成带参数的二维码
Wechat.prototype.createQrcode = function(qr) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.qrcode.create + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": qr, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('createQrcode fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.showQrcode = function(ticket) {
    return api.qrcode.show + "ticket=" + encodeURI(ticket);
}

//长链接转短链接接口
Wechat.prototype.createshortUrl = function(action, url) {
    action = action || "long2short";
    var that = this;

    var form = {
        action: action,
        long_url: url
    }

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.shortUrl.create + 'access_token=' + data.access_token;

                request({ "method": "POST", "url": url, "body": form, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('createshortUrl fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

//微信智能接口语义理解
Wechat.prototype.semantic = function(semanticData) {
    var that = this;

    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.semanticUrl + 'access_token=' + data.access_token;
                semanticData.appid = data.appID;

                request({ "method": "POST", "url": url, "body": semanticData, "json": true }).then(function(response) {
                    var _data = response["body"];

                    //console.log(response);
                    //return;
                    if (_data) {
                        resolve(_data);
                    } else {
                        throw new Error('semanticUrl fails');
                    }
                }).catch(function(err) {
                    reject(err);
                })
            })
    });
}

Wechat.prototype.reply = function() {
    var content = this.body;
    var message = this.weixin;
    var xml = util.tpl(content, message); //经模板处理

    //console.log("content：" + content+"\n");
    //console.log("message：" + message+"\n");
    //console.log("xml：" + xml+"\n");

    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
}

module.exports = Wechat;
