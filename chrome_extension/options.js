var mainApp, looptime, blockedretrytime, autosendroomid;

function constructOptions() {
    document.getElementById('default_options').onclick = function(e) {
        default_options();
    };

    document.getElementById('apply').onclick = function(e) {
        apply();
    };

    document.getElementById('reboot').onclick = function(e) {
        reboot();
    };
}

function default_options() {
    document.getElementById('looptime').value = mainApp.OPTS.DEFAULT_LOOP_TIME / 1000;
    document.getElementById('blockedretrytime').value = mainApp.OPTS.DEFAULT_BLOCKED_RETRY_TIME / 1000;
    document.getElementById('autosendroomid').value = mainApp.OPTS.DEFAULT_AUTO_SEND_ROOM_ID;
}

function apply() {
    popBox('设置中...');
    var num1 = parseInt(document.getElementById('looptime').value) * 1000;
    var num2 = parseInt(document.getElementById('blockedretrytime').value) * 1000;
    var num3 = parseInt(document.getElementById('autosendroomid').value);

    mainApp.setStorage('looptime', num1,
    function() {
        mainApp.loopTime = num1;
		mainApp.currentLoopTime = num1;
        mainApp.setStorage('blockedretrytime', num2,
        function(result) {
            mainApp.blockedRetryTime = num2;
            mainApp.setStorage('autosendroomid', num3,
            function(result) {
                mainApp.autosendroomid = num3;
                closeBox();
            });

        });
    });

}

function reboot() {
    popBox('重启中...', 1500);
    mainApp.stopRun();
    mainApp.init();
    mainApp.startRun();

}

function popBox(val, time) {
    var popBox = document.getElementById("popBox");
    var popLayer = document.getElementById("popLayer");
    var popContent = document.getElementById("popContent");
    popBox.style.display = "block";
    popLayer.style.display = "block";
    popContent.innerHTML = val;
    if (time) {
        setTimeout(closeBox, time);
    }
};

function closeBox() {
    var popBox = document.getElementById("popBox");
    var popLayer = document.getElementById("popLayer");
    popBox.style.display = "none";
    popLayer.style.display = "none";
}

window.onload = function() {
    mainApp = chrome.extension.getBackgroundPage().mainApp;
    mainApp.getStorage('looptime',
    function(result) {
        if (result.looptime) document.getElementById('looptime').value = parseInt(result.looptime) / 1000;
        else document.getElementById('looptime').value = mainApp.OPTS.DEFAULT_LOOP_TIME / 1000;

        mainApp.getStorage('blockedretrytime',
        function(result) {
            if (result.blockedretrytime) document.getElementById('blockedretrytime').value = parseInt(result.blockedretrytime) / 1000;
            else document.getElementById('blockedretrytime').value = mainApp.OPTS.DEFAULT_BLOCKED_RETRY_TIME / 1000;
            mainApp.getStorage('autosendroomid',
            function(result) {
                if (result.autosendroomid) document.getElementById('autosendroomid').value = result.autosendroomid;
                else document.getElementById('autosendroomid').value = mainApp.OPTS.DEFAULT_AUTO_SEND_ROOM_ID;
                constructOptions();

            });

        });

    });

}