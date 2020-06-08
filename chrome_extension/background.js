var Gift=function(typeid, type, id, roomid, time, timeWait){
		this.typeid = typeid;
		this.type = type;
		this.id = id;
		this.roomid = roomid;
		this.time = time * 1000;
		this.timeWait = timeWait * 1000;
		this.hasPick = false;
		this.creatTime = new Date().getTime();
		this.dieTime = this.creatTime;
		this.die = false;
		this.user = new Array();

}
Gift.prototype = { 

	die: function(reason) {
		this.die = true;
		this.dieReason = reason;
		this.dieTime = new Date().getTime();
	},

	vaild: function(nowTime) {
		if (this.die)
			return false;
		var dtime = this.nowTime - this.creatTime;
		if (this.timeWait >= 0 && (this.time - dtime) >= 0) {
			if ((this.timeWait - dtime) <= 0)
				return true;
			else
				return false;
		} else {
			this.die= true;
		}
		return false;
	},

	getId: function() {
		return this.id;
	},

	setId: function(id) {
		this.id = id;
	},

	getRoomid: function() {
		return this.roomid;
	},

	setRoomid: function(roomid) {
		this.roomid = roomid;
	},

	getTime: function() {
		return this.time;
	},

	setTime: function(time) {
		this.time = time;
	},

	getTimeWait: function() {
		return this.timeWait;
	},

	setTimeWait: function(timeWait) {
		this.timeWait = timeWait;
	},

	getCreatTime: function() {
		return this.creatTime;
	},

	setCreatTime: function(creatTime) {
		this.creatTime = creatTime;
	},

	isDie: function() {
		return this.die;
	},

	setDie: function(die) {
		this.die = die;
	},

	getUser: function() {
		return this.user;
	},

	setUser: function(user) {
		this.user = user;
	},

	toString: function() {
		return "gift type " + this.type + " id " + this.id + " roomid " + this.roomid + " time " + this.time + " timeWait " + this.timeWait
				+ " dTime " + (this.dieTime - this.creatTime) + " die " + this.die + " dieReason " + this.dieReason;
	}
}

var MAINAPP = function() {
    this.OPTS = {
        DEBUG: true,
		BILI_LOGIN_URL: 'https://passport.bilibili.com/login',
        AJAX_TIMEOUT_MS: 15000,
        FAST_AJAX_TIMEOUT_MS: 5000,
        DEFAULT_BLOCKED_RETRY_TIME: 5 * 60 * 1000,
        DEFAULT_LOOP_TIME: 120 * 1000,
		DEFAULT_AUTO_SEND_ROOM_ID: 1314,
        DEVICE_PLATFORM: 'chrome',
        DEFAULT_COUNTRY_CODE: 'us',
    };
    this.STATES = {
        NOT_LOGIN: 0,
        CAN_RUN: 1,
        NOT_RUN: 2,
        GET_ROOM: 3,
        CHECK_ROOM: 4,
		CHECK_GIFT: 5,
		LOOP_END: 6,
        ON_ERROR: 7,
        SERVER_ERROR: 8,
    };
    
}
MAINAPP.prototype = {

    init: function(callback) {
        this.totalHot = 0;
        this.oneLoopHot = 0;
		this.bagHot = 0;
        this.loopNum = 0;
		this.currentLoopTime = this.OPTS.DEFAULT_LOOP_TIME;
        this.loopTime = this.OPTS.DEFAULT_LOOP_TIME;
		this.blockedRetryTime = this.OPTS.DEFAULT_BLOCKED_RETRY_TIME;
		this.autoSendRoomId = this.OPTS.DEFAULT_AUTO_SEND_ROOM_ID;
        this.loopInterval = false;
        this.startTime = 0;
        this.blockedTime = 0;
        this.loopStartTime = 0;
		this.loopStopTime = 0;
        this.roomMap = new Array();
        this.areaMap = new Array();
        this.hotpickMap = new Array();
		this.hotpickMapSave = new Array();
        this.ajaxMap = new Array();
        this.roomHasCheck = 0;
		this.giftHasCheck = 0;
		this.validGift = 0;
        this.errorNum = 0;
        this.errorMax = 3;
        this.hasBlocked = false;
        this.msgBlocked = false;
        this.sleepTime = 0;
		this.onrun = false;
        this.biliJct = null;
		this.account = null;
		this.giftHasSend = -999999;
        var _that = this;
        this.state.set(this.STATES.NOT_RUN);
		
    },

	initConfig: function(callback) {
		var _that = this;
		_that.getStorage('looptime',
		function(result) {
			if (result.looptime) _that.loopTime = parseInt(result.looptime);
	
			_that.getStorage('blockedretrytime',
				function(result) {
					if (result.blockedretrytime) _that.blockedRetryTime = parseInt(result.blockedretrytime);
			
				_that.getStorage('autosendroomid',
					function(result) {
						if (result.autosendroomid)  _that.autoSendRoomId = parseInt(result.autosendroomid);
							
				});
		
			});
		
		});
        

		_that.getAllHotNum(function(num) {
			if(num!=-1){
				_that.bagHot = num;
				_that.getCookie("https://live.bilibili.com", "bili_jct",
				function(cookie) {
					if(cookie) {
						_that.biliJct = cookie.value;
						_that.state.set(_that.STATES.CAN_RUN);
					}
					
					if(callback) callback();
				});
			}else{
				_that.state.set(_that.STATES.NOT_LOGIN);
				if(callback) callback();
			}
        });
	},
    startRun: function() {
		if(this.loopInterval) return;
		var _that = this;
		this.state.set(this.STATES.NOT_RUN);
		this.initConfig(function(){
			if(_that.state.get() == _that.STATES.CAN_RUN){
				_that.loopInterval = true;
				_that.activateBrowserIcon(true);
				_that.currentLoopTime = _that.loopTime;
				var time = new Date().getTime();
				var looptime = 100;
				_that.startTime = time;
				_that.loopStartTime = time;
				_that.loopStopTime = time - _that.currentLoopTime - looptime;
				_that.totalHot = 0;
				_that.loopNum = 0;
				_that.loopInterval=window.setInterval(function(){
					_that.run();
					_that.pickupRoomGiftLoop();
				},looptime);
			}
		});

    },
    
    stopRun: function() {
        window.clearInterval(this.loopInterval);
		this.loopInterval = false;
        this.activateBrowserIcon(false);
		this.state.set(this.STATES.CAN_RUN);
    },

    run: function() {
		var _that = this;
		
		if(_that.onrun || (_that.loopStopTime + _that.currentLoopTime) > new Date().getTime()) return ;
		
		_that.onrun = true;
		
		_that.autoSendGift();
		
		if(_that.hasBlocked) _that.currentLoopTime = _that.loopTime;

        _that.loopStartTime = new Date().getTime();

		_that.activateBrowserIcon(true);
		_that.loopNum++;
        _that.roomMap = new Array();
        _that.areaMap = new Array();
        _that.hotpickMap = new Array();
        _that.ajaxMap = new Array();
        _that.errorNum = 0;
        _that.oneLoopHot = 0;
        _that.hasBlocked = false;
        _that.roomHasCheck = 0;
		_that.giftHasCheck = 0;
		_that.validGift = 0;
        _that.blockedTime = 0;
		_that.log("---------------loop "+ _that.loopNum +" onrun----------------");
        _that.getCookie("https://live.bilibili.com", "bili_jct", function(cookie) {
			if(cookie){
				_that.biliJct = cookie.value;
				_that.initRoomMap();
			}else{
				_that.stopRun();
				_that.state.set(_that.STATES.NOT_LOGIN);
			}
        });

    },
    
    initRoomMap: function() {
		this.state.set(this.STATES.GET_ROOM);
        for (var i = 0; i < 7; i++) {
            this.getRoomData(this, i, 1, this.checkGetRoomDataEnd);
        }
    },

    getRoomData: function(self, area_id, page, checkGetRoomDataEnd) {
        var _that = self;
		if (_that.hasBlocked) {
            _that.log("getRoomData已被和谐");
            return;
        }
        var url = 'https://api.live.bilibili.com/rankdb/v1/Rank2018/getWebTop?date=week&type=master_vitality_2018&area_id=' + area_id + '&page=' + page + '&is_trend=1&page_size=20';
        _that.ajaxMap.push($.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'GET',
            url: url,
            async: true,
            //cache: false,
            dataType: 'json',
            data: '',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
				
                if (xhr.code != 0 || xhr.data.list.length < 1) {
                    checkGetRoomDataEnd(_that, true, area_id);
                } else {
                    for (var value of xhr.data.list) {
                        if (value.liveStatus == 1 && _that.roomMap.indexOf(value.roomid) == -1) _that.roomMap.push(value.roomid)
                    }
					
                    _that.getRoomData(_that, area_id, page + 1, checkGetRoomDataEnd);
                }
            },
            error: function(xhr) {
                _that.xhrBlocked(_that, xhr, "error initRoomMap");
				checkGetRoomDataEnd(_that, false, area_id);
                
            }
        }));
    },


    checkGetRoomDataEnd: function(self, blocked, area_id) {
        var _that = self;
		if (_that.hasBlocked) {
            _that.log("checkGetRoomDataEnd已被和谐");
            return;
        }
        if (_that.areaMap.indexOf(area_id) == -1) _that.areaMap.push(area_id);
        if (_that.areaMap.length == 7) {
            _that.log(new Date().getTime() - _that.loopStartTime + "ms找到"+_that.roomMap.length + "主播在线");
			_that.ajaxMap = new Array();
			_that.state.set(_that.STATES.CHECK_ROOM);
            for(var i=0;i<_that.roomMap.length;i++)
                _that.checkRoomGift(_that, i,_that.checkRoomGiftEnd);
        }
    },

    checkRoomGift: function(self, index, checkRoomGiftEnd) {
		//todo
        var _that = self;
        if (_that.hasBlocked) {
            _that.log("checkRoomGift已被和谐");
            return;
        }
        //if ( index != 0 && index%30 == 0) this.sleep(3000);
        var url = 'https://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/Check?roomid=' + this.roomMap[index];
        _that.ajaxMap.push($.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'GET',
            url: url,
            async: true,
            //cache: false,
            data: '',
            crossDomain: true,
			beforeSend: function(xhr) {
				//xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
                //xhr.setRequestHeader("origin", "https://live.bilibili.com");
				//xhr.setRequestHeader("referer", "https://live.bilibili.com/1314");
				//xhr.setRequestHeader("sec-fetch-site", "same-site");
            },
            //headers:{'Content-Type':'application/json;charset=utf8','organId':'1333333333'},
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
                for (var value of xhr.data.guard) {
                    var indexof = -1;
                    for (var i = 0; i < _that.hotpickMap.length; i++) {
                        if (_that.hotpickMap[i].id == value.id) {
                            indexof = i;
                            break;
                        }
                    }
                    if (indexof == -1) {
                        _that.hotpickMap.push(new Gift(1,'guard',value.id, _that.roomMap[i],value.time, value.time_wait));

                    }
                }
                for (var value of xhr.data.gift) {
                    var indexof = -1;
                    for (var i = 0; i < _that.hotpickMap.length; i++) {
                        if (_that.hotpickMap[i].roomid == value.raffleId) {
                            indexof = i;
                            break;
                        }
                    }
                    if (indexof == -1) {
                    _that.hotpickMap.push(new Gift(2, value.type ,value.raffleId, _that.roomMap[i],value.time, value.time_wait));

                    }
                }
				
				for (var value of xhr.data.pk) {
                    var indexof = -1;
                    for (var i = 0; i < _that.hotpickMap.length; i++) {
                        if (_that.hotpickMap[i].roomid == value.room_id) {
                            indexof = i;
                            break;
                        }
                    }
                    if (indexof == -1) {
                    _that.hotpickMap.push(new Gift(3, 'pk' ,value.id, _that.roomMap[i],value.time, value.time_wait));

                    }
                }
				
				
                checkRoomGiftEnd(_that);
            },
            error: function(xhr) {
                _that.xhrBlocked(_that, xhr, "error checkroomid");
                checkRoomGiftEnd(_that);
            },
            dataType: 'json'
        }));

    },
	
	checkRoomGiftEnd: function(self) {
        var _that = self;
        if (_that.hasBlocked) {
            _that.log("checkRoomGiftEnd已被和谐");
            return;
        }

        _that.roomHasCheck++;
        if(_that.roomHasCheck >= _that.roomMap.length) {
			
			_that.ajaxMap = new Array();
			_that.state.set(_that.STATES.CHECK_GIFT);
            for(var i=0;i<_that.hotpickMap.length;i++){
                if (_that.hotpickMap[i].time_wait == 0) {
					_that.hotpickMap[i].die = true;
					_that.hotPick(_that, i)
					_that.validGift++;
				}	
            }
			_that.hotpickMapSave = _that.hotpickMap.concat();
			_that.log(_that.hotpickMap.length + "直播间有辣条"+ _that.validGift+"间可捡");

			if(_that.validGift == 0){
				_that.loopStopTime = new Date().getTime();
				_that.log((_that.loopStopTime - _that.loopStartTime)  + "ms捡到" + _that.oneLoopHot+"共捡到" + _that.totalHot+"背包有"+(_that.totalHot + _that.bagHot));
				_that.onrun = false;
				_that.state.set(_that.STATES.LOOP_END);

			}
            return;
        }

    },
	
	pickupRoomGiftLoop:function(){
		for(var i=0;i<this.hotpickMapSave.length;i++){
            if (this.hotpickMapSave[i].vaild(new Date().getTime())) {
				this.hotPick(this, i);
			}
        }
	},

    hotPick: function(self,index) {
		//todo 
        var _that = self;
		if (_that.hasBlocked) {
            _that.log("hotPick已被和谐");
            return;
        }
        if (_that.hotpickMap[index].time_wait != 0) {
            return;
        }

        var data = 'id=' + _that.hotpickMap[index].id + '&roomid=' + _that.hotpickMap[index].roomid + '&type='+ _that.hotpickMap[index].type +'&csrf_token=' + _that.biliJct + '&csrf=' + _that.biliJct + '&visit_id=';
        var url = 'https://api.live.bilibili.com/xlive/lottery-interface/v5/smalltv/join';
		if(_that.hotpickMap[index].type =="guard") url = 'https://api.live.bilibili.com/xlive/lottery-interface/v3/guard/join';
		if(_that.hotpickMap[index].type =="pk") url = 'https://api.live.bilibili.com/xlive/lottery-interface/v2/pk/join';
        _that.ajaxMap.push($.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'POST',
            url: url,
            async: true,
            //cache: false,
            dataType: "json ",
            data: data,
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
                if (xhr.code == 0 && xhr.data.award_num != undefined) {
                    _that.oneLoopHot += xhr.data.award_num;
                } else {
                    _that.log("error code: " + xhr.code);
                    _that.log(xhr);
                }
				_that.hotPickEnd(_that);
				_that.log(xhr);

            },
            error: function(xhr) {
                _that.xhrBlocked(_that, xhr, "error pickhot");
				_that.hotPickEnd(_that);
            }
        }));

    },
    
	
	hotPickEnd: function(self) {
        var _that = self;
        if (_that.hasBlocked) {
            _that.log("hotPickEnd已被和谐");
            return;
        }
		var tmp = 
        _that.giftHasCheck++;

		
		if(_that.giftHasCheck >= _that.validGift) {
            _that.totalHot += _that.oneLoopHot;
			_that.loopStopTime = new Date().getTime();
            _that.log((_that.loopStopTime - _that.loopStartTime)  + "ms捡到" + _that.oneLoopHot+"共捡到" + _that.totalHot+"背包有"+(_that.totalHot + _that.bagHot));
			_that.onrun = false;
			_that.state.set(_that.STATES.LOOP_END);

            return;
        }


    },
    
	autoSendGift: function(callback) {
		var date = new Date();
		var hour=date.getHours();
		var mintes=date.getMinutes();
		if(hour == 23 && (mintes + this.currentLoopTime/60000) > 60){
			var loop = 0;
			var _that = this;
			if(_that.giftHasSend == -999999)_that.sendGiftByRoomId(_that.autoSendRoomId);
			var loopInterval=window.setInterval(function(){
					loop++;
					if(_that.giftHasSend != -999999 && _that.giftHasSend < 0) {
						_that.sendGiftByRoomId(_that.autoSendRoomId);
					}
					if(loop >2 ) {
						_that.giftHasSend = -999999
						window.clearInterval(loopInterval);
					}
					if(_that.giftHasSend==0) window.clearInterval(loopInterval);
				},3000);
		}
	},
	
	getAccount: function(callback) {
		var url = 'https://api.bilibili.com/x/member/web/account';
        var _that = this;
        $.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'GET',
            url: url,
            async: true,
            //cache: false,
            dataType: 'json',
            data: '',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
                //_that.log(xhr);
				
				if(xhr.code == 0 && xhr.data.mid != undefined){
					_that.account = xhr;
					callback(true, xhr.data.mid);
				}else{
					callback(false, xhr);
				}
            },
            error: function(xhr) {
                callback(false, xhr);
            }
        });
	},
	
	getRoomUid: function(roomid, callback) {
		var url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id='+roomid;
        var _that = this;
        $.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'GET',
            url: url,
            async: true,
            //cache: false,
            dataType: 'json',
            data: '',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
                //_that.log(xhr);
				if(xhr.code == 0 && xhr.data.room_info.uid != undefined){
					callback(true, xhr.data.room_info.uid,xhr.data.room_info.room_id);
				}else{
					callback(false, xhr);
				}
				
            },
            error: function(xhr) {
                callback(false, xhr);
            }
        });
	},
	
	sendGiftByRoomId: function(roomid) {
		var _that = this;
		var luid,lruid,lroomid;
		_that.giftHasSend = -999999;
		_that.getAccount(function(success, uid){
			if(success) {
				luid = uid;
				_that.getRoomUid(roomid, function(success, ruid, roomid){
					if(success){
						lruid = ruid;
						lroomid = roomid;
						_that.getBagList(function(success, xhr){
							if(success){
								_that.giftHasSend  -= xhr.data.list.length;
								for(var i=0;i<xhr.data.list.length;i++) {
									_that.sendGift(luid,lruid,roomid,xhr.data.list[i],function(success, xhr){
										if(success) _that.giftHasSend +=1;
									});
								}
							}
						});
					}
				});
			}
		});
	},
	
	sendGift: function(uid, ruid, roomid, giftdata, callback) {
        var _that = this;

        _that.getCookie("https://live.bilibili.com", "bili_jct", function(cookie){
		if(cookie) {
			_that.biliJct = cookie.value;
		
		var data = 'uid='+ uid +'&gift_id='+ giftdata.gift_id +'&ruid='+ ruid +'&send_ruid=0&gift_num='+ giftdata.gift_num +'&bag_id='+ giftdata.bag_id +'&platform=pc&biz_code=live&biz_id='+ roomid +'&rnd='+ Math.floor((new Date().getTime())/1000) +'&storm_beat_id=0&metadata=&price=0&csrf_token='+ _that.biliJct +'&csrf='+ _that.biliJct +'&visit_id=';
		var url = 'https://api.live.bilibili.com/gift/v2/live/bag_send';
        $.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'POST',
            url: url,
            async: true,
            //cache: false,
            dataType: "json ",
            data: data,
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
				//console.log(xhr);
				if(xhr.code==0){
					callback(true,xhr);
				}else{
					callback(false,xhr);
				}
            },
            error: function(xhr) {
                callback(false,xhr);
            }
        });
		}});
	},
	
	getBagList: function(callback) {
		var url = 'https://api.live.bilibili.com/xlive/web-room/v1/gift/bag_list?t=' + Math.floor(new Date().getTime() / 1000) + '&room_id=1314';
        var _that = this;
        $.ajax({
            timeout: _that.OPTS.FAST_AJAX_TIMEOUT_MS,
            type: 'GET',
            url: url,
            async: true,
            //cache: false,
            dataType: 'json',
            data: '',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(xhr) {
                //_that.log(xhr);
				if(xhr.code == 0 && xhr.data.list!= undefined){
					callback(true, xhr);
				}else{
					callback(false, xhr);
				}
            },
            error: function(xhr) {
                callback(false, xhr);
            }
        });
	},
	
    getAllHotNum: function(callback) {
		var _that = this;
		_that.getBagList(function(success, xhr) {
			if(success){
				if(xhr.code == -101){
					callback(-1);
				}else if(xhr.code == 0 && xhr.data.list){
					var total = 0;
					for (var i = 0; i < xhr.data.list.length; i++) {
						total += xhr.data.list[i].gift_num;
					}
					callback(total);
				}else{
					callback(-1);
				}
			}else{
				callback(-1);
			}
		});
    },

    checkBlocked: function(self) {
        if (self.hasBlocked) {
            self.log("checkBlocked已被和谐");
            return false;
        }
    },
    xhrBlocked: function(self, xhr, msg) {
		var _that = self;
        _that.log(msg);
        //console.log(xhr);
        _that.errorNum++;
        if (_that.errorNum >= _that.errorMax && !_that.hasBlocked) {
			_that.loopStopTime = new Date().getTime();
			_that.currentLoopTime = _that.blockedRetryTime;
			_that.activateBrowserIcon(true, "NA");
            _that.hasBlocked = true;
			_that.blockedTime = new Date().getTime();
			_that.onrun = false;
			_that.state.set(_that.STATES.ON_ERROR);

			for(var i = 0;i<_that.ajaxMap.length;i++){
                _that.ajaxMap[i].abort();
            }
            _that.ajaxMap = new Array();
        }
    },

    state: {
        value: '',

        set: function(val) {
            var old = this.value;
            this.value = val;
            if (old != val) this.onChange.dispatchevent(old, val);
        },
        get: function() {
            return this.value;
        },
        onChange: {
            listener: new Array(),
            addListener: function(callback) {
                if (this.listener.indexOf(callback) == -1) this.listener.push(callback);
            },
            removeListener: function(item) {
                for (var i = 0; i < this.listener.length; i++) {
                    if (this.listener[i] == item) {
                        _that.log(this.listener);
                        this.listener.splice(i, 1);
                        i--;
                    }
                }
            },
            dispatchevent: function(oldState, newState) {
                for (var i = 0; i < this.listener.length; i++) {
                    if (this.listener[i](oldState, newState)) {
                        this.listener.splice(i, 1);
                        i--;
                    }
                }
            },
        },
    },

    setPopup: function(popupPage) {
        chrome.browserAction.setPopup({
            popup: popupPage
        });
    },

    openPage: function(page, focusOnTab) {
        if (focusOnTab == null) {
            focusOnTab = true;
        }
        return chrome.tabs.create({
            url: page,
            active: focusOnTab
        });
    },

    activateBrowserIcon: function(doActivate, mytext) {
		if (mytext == null) mytext="";
        if (doActivate) {
			var title = "辣条机器人正在运行";
			if (mytext == "NA") title = "辣条机器人已被和谐";
            chrome.browserAction.setIcon({
                path: "images/icon-19-clicked.png"
            });
            chrome.browserAction.setBadgeText({
                text: mytext
            });
            chrome.browserAction.setTitle({
                title: title
            });
        } else {
            chrome.browserAction.setIcon({
                path: "images/icon-19.png"
            });
            chrome.browserAction.setBadgeText({
                text: mytext
            });
            chrome.browserAction.setTitle({
                title: "启动辣条机器人"
            });
        }
    },

    log: function(out) {
        if (this.OPTS.DEBUG && out) console.log(out);
    },

    sleep: function(msec) {
        var now = new Date();
        var exitTime = now.getTime() + msec;
        while (true) {
            now = new Date();
            if (now.getTime() > exitTime) return;
        }
    },

    setStorage: function(key, value, callback) {
        chrome.storage.local.set(JSON.parse('{"' + key + '":"' + value + '"}'), callback);
    },

    getStorage: function(key, callback) {
        chrome.storage.local.get(key,
        function(items) {
            callback(items);
        });
    },
    getCookie: function(url, key, callback, params) {
        chrome.cookies.get({
            url: url,
            name: key
        },
        function(cookie) {
            if (params) {
                callback(cookie, params);
            } else {
                callback(cookie);
            }
        });
    },
    setCookie: function(url, name, value, expireSecond) {
        //var exdate = new Date();
        var param = {
            url: url,
            name: name,
            value: value,
            path: '/'
        };
        if ( !! expireSecond) {
            param.expirationDate = new Date().getTime() / 1000 + expireSecond;
        }
        chrome.cookies.set(param,
        function(cookie) {});
    }

}

window.onload = function() {
    window.mainApp = new MAINAPP();
    console.log('Init.');
    mainApp.init();
}