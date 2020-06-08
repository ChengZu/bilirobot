var mainApp = chrome.extension.getBackgroundPage().mainApp;
var msg;
function constructPage() {

    var options = document.getElementsByClassName('settings');
    for (var item of options) {
        item.onclick = function(e) {
            mainApp.openPage("options.html");
            window.close();
        };
    }

    document.getElementById('stoprunBtn').onclick = function(e) {
        mainApp.stopRun();
        window.close();
    };

    if (!mainApp.loopInterval) {
        hiddenPage(false, true, true);
        mainApp.startRun();
    }
    autoUpdateState();

}

function autoLogin() {

}

function autoUpdateState() {
    var dom = document.getElementById('activating-text');
    msg = "<br /><br />第" + mainApp.loopNum + "轮" + mainApp.hotpickMap.length + "/" + mainApp.validGift + "捡到" + mainApp.oneLoopHot + "根辣条<br />共捡到" + mainApp.totalHot + "背包有" + (mainApp.bagHot + mainApp.totalHot);
    updateState(dom);
    var interval = window.setInterval(function() {
        updateState(dom);
    },
    500);
}
function updateState(dom) {
    if (mainApp.state.get() == mainApp.STATES.NOT_RUN) {
        return;
    }

    if (mainApp.state.get() == mainApp.STATES.CAN_RUN) {
        return;
    }

    if (mainApp.state.get() == mainApp.STATES.NOT_LOGIN) {
        hiddenPage(true, true, false);
        setTimeout(gotoLogin, 1500);
        return;
    }

    hiddenPage(true, false, true);

    var html = "";
    if (mainApp.state.get() == mainApp.STATES.GET_ROOM) {
        html = "加载直播间数据..."
    }
    if (mainApp.state.get() == mainApp.STATES.CHECK_ROOM) {
        html = mainApp.roomMap.length + "直播间觅羔羊..."
    }
    if (mainApp.state.get() == mainApp.STATES.CHECK_GIFT) {
        html = mainApp.hotpickMap.length + "直播间有辣条" + mainApp.validGift + "间可捡";
    }
    if (mainApp.state.get() == mainApp.STATES.LOOP_END) {
        var time = Math.ceil((mainApp.loopTime - (new Date().getTime() - mainApp.loopStopTime)) / 1000);
        html = "机器人在休息" + time + "s.";
        //msg = "<br /><br />第" + mainApp.loopNum + "轮" + mainApp.hotpickMap.length + "/" + mainApp.validGift + "捡到" + mainApp.oneLoopHot + "根辣条<br />共捡到" + mainApp.totalHot + "背包有" + (mainApp.bagHot + mainApp.totalHot);
    }
    if (mainApp.state.get() == mainApp.STATES.ON_ERROR) {
        var time = Math.ceil((mainApp.blockedRetryTime - (new Date().getTime() - mainApp.blockedTime)) / 1000);
        html = "机器人已被和谐" + time + "s.";
    }
    msg = "<br /><br />第" + mainApp.loopNum + "轮" + mainApp.hotpickMap.length + "/" + mainApp.validGift + "捡到" + mainApp.oneLoopHot + "根辣条<br />共捡到" + mainApp.totalHot + "背包有" + (mainApp.bagHot + mainApp.totalHot);

    dom.innerHTML = html + msg;

}

function gotoLogin() {
    mainApp.openPage(mainApp.OPTS.BILI_LOGIN_URL);
    window.close();
}

function hiddenPage(activationHalfPage, activationDonePage, activationErrorPage) {

    if (activationHalfPage) document.getElementById('activation-half').style.display = "none";
    else document.getElementById('activation-half').style.display = "block";

    if (activationDonePage) document.getElementById('activation-done').style.display = "none";
    else document.getElementById('activation-done').style.display = "block";

    if (activationErrorPage) document.getElementById('activation-error').style.display = "none";
    else document.getElementById('activation-error').style.display = "block";

    document.getElementById('white').style.display = "block";
}

window.onload = function() {
    constructPage();
}