const fun = new MainFun();
const tip = IUToast;
const lgb = fun.languageChoice();
const contract_address = fun.getParameter("contract");
const baseUrl = 'http://community.codeislaw.co/vote.html';
var shareUrl = window.location.href;//baseUrl + "?contract=" + contract_address;
var userAddress = '';
var commAbi = '';
var commBin = '';
var contract = '';
var instance = '';  // contract instance

var status = -1;
var userVp = 0;
var userChoice = -1;
var title = '';
var numChoices = 0;
var choices = '';
var choiceTexts = [];
var choiceVotes = [];

$(function () {
    // init the abi and bin
    getAbi();
    getBin();
    initLanguage();

    // execute this immediately
    checkStatus();
    // Update every 15 seconds
    setInterval(function () {
        checkStatus('reload');
    }, 15 * 1000);
});


// init language
var initLanguage = function () {
    if (lgb == '' || lgb == null) {
        return;
    }
    fun.changeDomContentById("submit", lgb.submit);
    fun.changeDomContentById("contractAddress", lgb.contractAddress);
    fun.changeDomContentById("returnBack", lgb.back);
}

var checkStatus = function (type) {
    if (type != 'reload') {
        tip.loading(lgb.tip.loading);
    }
    web3.cmt.getAccounts(function (e, address) {
        if (e) {
            tip.error(lgb.user.errorInfo);
        } else {
            userAddress = address.toString();
            var contractLink = '<a href="https://www.cmttracking.io/address/' + contract_address + '">' + dealUserAddress(contract_address) + '</a>'
            $("#contractAddress").html(contractLink);
            $("#removedTheInterval").val(true);
            contract = web3.cmt.contract(commAbi, contract_address);
            instance = contract.at(contract_address);
            instance.checkStatus(userAddress, function (e, r) {
                if (e) {
                    console.log(e);
                    tip.error(lgb.error);
                    return;
                } else {
                    status = Number(r[0]);
                    userVp = Number(r[1]);
                    userChoice = Number(r[2]);
                    title = r[3];
                    numChoices = Number(r[4]);
                    choices = r[5];
                    choiceTexts = choices.split("|");
                    choiceVotes = r[6];

                    $("#title").text(title);
                    for (var i = 0; i < numChoices; i++) {
                        var choiceText = choiceTexts[i] + " [" + choiceVotes[i] + "]";
                        var div = '<div class="main-contain"><div class="main-choice" name="choice" id="choice-option-' + i + '"><div class="main-join-div">' + choiceText + '</div><div class="main-choice-right-div main-hidden"><img class="main-choice-right" src="./images/choice.png"></div><div hidden="hidden">' + i + '</div></div></div>';
                        html += div;
                    }
                    document.getElementById("choices").innerHTML = html;
                    bindSelect();

                    if (userVp == 0) {
                        // remove submit button
                        if (document.getElementById("submit-div")) {
                            document.getElementById("submit-div").remove();
                        }
                    }

                    if (userChoice >= 0) {
                        // mark the choice
                        document.getElementById("choice-option-"+userChoice).childNodes[1].style.visibility = 'visible';
                        // disable selection
                        unbindSelect();
                        // remove submit button
                        if (document.getElementById("submit-div")) {
                            document.getElementById("submit-div").remove();
                        }
                    }

                }
            });
        }
    });
}

var dealUserAddress = function (address) {
    var result = "0x0000....0000";
    if (address != null && address != '' && address.length > 10) {
        result = address.substr(0, 5) + '....' + address.substr(address.length - 5, 5);
    }
    return result;
}

var getAbi = function () {
    $.ajax({
        url: 'CommunityVote.abi',
        sync: true,
        dataType: 'text',
        success: function (data) {
            commAbi = JSON.parse(data);
        }
    });
}

var getBin = function () {
    $.ajax({
        url: 'CommunityVote.bin',
        dataType: 'text',
        sync: true,
        success: function (data) {
            commBin = JSON.parse(data);
        }
    });
}

var unbindSelect = function () {
    var elements = document.getElementsByName("choice");
    if (elements == undefined || elements == '' || elements == null) {
        return;
    }
    for (var i = 0; i < elements.length; i++) {
        fun.delMainEvent(elements[i], "click", optionSelect);
    }
}

var bindSelect = function () {
    var elements = document.getElementsByName("choice");
    for (var i = 0; i < elements.length; i++) {
        fun.addMainEvent(elements[i], "click", optionSelect);
    }
}

var confirmOption = function () {
    var selectedValue = $("#selectedValue").val();
    if (selectedValue == null || selectedValue == '' || selectedValue < 0) {
        tip.error(lgb.tip.selectChoice);
        return;
    }
    confirmOptionSubmit();
}

var onlyNumber = function (obj) {
    if (obj.indexOf(".") > -1) {
        console.log(obj.substr(0, obj.indexOf(".")));
        $("#SubmitValue").val(obj.substr(0, obj.indexOf(".")));
        tip.error(lgb.tip.positive)
        return;
    }
    obj = obj.replace(/\D/g, '');
    var t = obj.charAt(0);
    if (t == 0) {
        obj = obj.substr(1, obj.length);
    }
    $("#SubmitValue").val(obj);
    return obj;
}

var confirmOptionSubmit = function () {
    var selectedValue = $("#selectedValue").val();
    tip.loading(lgb.tip.processing);
    $("#callbackStop").val(true);
    // change the submit button color and event
    var root = document.getElementsByClassName("main-button")[0];
    root.style.cssText = "background-color: #c6cfd5;";
    var obj = document.getElementById("submit-div");
    fun.delMainEvent(obj, "click", confirmOption);
    var feeData = instance.vote.getData(selectedValue + "");
    web3.cmt.estimateGas({
        data: feeData,
        to: contract_address
    }, function (error, gas) {
        var virtualGas = '20000000';
        if (error) {
            console.log("error for get gas");
        } else {
            virtualGas = gas;
        }
        instance.vote(selectedValue, {
            gas: virtualGas,
            gasPrice: 2000000000
        }, function (e, result) {
            if (e) {
                if (e.code == '1001') {
                    tip.error(lgb.cancelled);
                } else {
                    tip.error(lgb.error);
                }
            } else {
                console.log(result);
                $("#msg").html(lgb.pendingVote);
                $('#msg').css('display','block');
                if (document.getElementById("submit-div")) {
                    document.getElementById("submit-div").remove();
                }
                tip.closeLoad();
                
                setTimeout(function () {
                    checkStatus('reload');
                }, 15 * 1000);
            }
        });
    });
}

var optionSelect = function () {
    var inputValue = this.children[2].innerHTML;
    var currentVisible = this.children[1].style.visibility;
    hiddenAllSelect();
    if (currentVisible != 'visible') {
        this.children[1].style.visibility = 'visible';
        document.getElementById("selectedValue").value = inputValue;
        var root = document.getElementsByClassName("main-button")[0];
        root.style.cssText = "background-color: #1976d2;";
        var obj = document.getElementById("submit-div");
        fun.addMainEvent(obj, "click", confirmOption);
    }
}

var hiddenAllSelect = function () {
    var allElement = document.getElementsByClassName("main-choice-right-div");
    for (var i = 0; i < allElement.length; i++) {
        allElement[i].style.visibility = 'hidden';
    }
    var root = document.getElementsByClassName("main-button")[0];
    root.style.cssText = "background-color: #c6cfd5;";
    var obj = document.getElementById("submit-div");
    fun.delMainEvent(obj, "click", confirmOption);
    document.getElementById("selectedValue").value = '';
}

var hiddenAllSelectAlert = function () {
    var allElement = document.getElementsByClassName("main-choice-right-div-alert");
    for (var i = 0; i < allElement.length; i++) {
        allElement[i].style.visibility = 'hidden';
    }
    document.getElementById("declareValue").value = '';
}
