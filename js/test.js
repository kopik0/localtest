
(function($, window, document, undefined) {

    'use strict';
    // Get member sessionStorage from maestro
    var member_dataSession = JSON.parse(window.parent.sessionStorage.getItem("member_info"));
    var ezcommCommunications;
    var scaseinteraction;
    var householdIdReviews = getAttributeValue("pyWorkPage", "MemberID");

    var activeTier1IframeId = window.parent.$('div[id^="PegaWebGadget"]').filter(
        function() {
            return this.id.match(/\d$/);
        }).filter(function() {
        return $(this).attr('aria-hidden') === "false";
    }).contents()[0].id;

    if (document.forms[0].elements["TaskSectionReference"].value == "UHG-MedRet-IIM-Work-ReviewRxBenefits"){
        var sCase = window.parent.$('iframe[id=' + activeTier1IframeId + ']').contents().find('title').html().trim();
        var interaction = window.parent.$("label:contains('Interaction ID:')").text().split(":")[1].trim();
        scaseinteraction = interaction + " " + sCase;
        sessionStorage.setItem("revRxBenScase", scaseinteraction);
        sessionStorage.setItem("campaignName", "Review Rx Benefits");
    }

    var isAutodocEnabled = function() {
        var configuration = false;
        var myObj = requestMetaDataMandR().plugins;
        Object.keys(myObj).forEach(function (key) {
            console.log(myObj[key].pluginId); // the value of the current key.
            if (myObj[key].pluginId === "10" && myObj[key].name === "Autodoc") {
                configuration = true;
                console.log('config is ON');
            }
        });
        return configuration;
    }();

    function getMemberDataMandR() {
        var ezcommMandRMemObj = {};

        var memberDob = member_dataSession.member_dob;
        var year = memberDob.substring(0, 4);
        var month = memberDob.substring(4, 6);
        var day = memberDob.substring(6, 8);
        memberDob = month + "/" + day + "/" + year;

        ezcommMandRMemObj.version = "2.0";
        ezcommMandRMemObj.firstName = member_dataSession.member_first_name;
        ezcommMandRMemObj.lastName = member_dataSession.member_last_name;
        ezcommMandRMemObj.subscriberId = member_dataSession.member_id.split('-')[0];

        ezcommMandRMemObj.idTypeCode = "20202";
        ezcommMandRMemObj.policyId = "0";
        ezcommMandRMemObj.encryptedFlag = false;
        ezcommMandRMemObj.dateOfBirth = memberDob;
        ezcommMandRMemObj.additionalIdentifiers = [{
            id: householdIdReviews,
            type: "GPSHID"
        }];
        return ezcommMandRMemObj;
    }

    function requestMetaDataMandR() {
        var requestMetaDataMandRObj = {};
        requestMetaDataMandRObj.agentId = pega.d.pyUID;
        requestMetaDataMandRObj.applicationName = "MAESTRO-EZCOMM";
        requestMetaDataMandRObj.lineOfBusiness = "M&R";

        var epmpObj = {};
        epmpObj.enabled = true;
        epmpObj.retrieveAllStatus = true;
        epmpObj.allowUpdate = false;
        requestMetaDataMandRObj.epmp = epmpObj;

        var contactObj = {};
        contactObj.enable_email = true;
        contactObj.enable_sms = true;
        contactObj.enable_fax = false;
        requestMetaDataMandRObj.contact_info_settings = contactObj;

        var widgetObj = {};
        widgetObj.name = "MAESTRO-COVID19";
        widgetObj.uuid = "4566-5446-4344-3454";
        requestMetaDataMandRObj.widget = widgetObj;

        var pluginObj = [];
        var plugin = {};
        plugin.pluginId = 5;
        plugin.name = "M&R";
        plugin.defaultCampaign = "COVID19 Resources";
        pluginObj.push(plugin);
        var plugin2 = {};
        plugin2.pluginId = "10";
        plugin2.name = "Autodoc";
        plugin2.params = {
            additionalAutoDoc: ""
        };
        pluginObj.push(plugin2);
        requestMetaDataMandRObj.plugins = pluginObj;

        return requestMetaDataMandRObj;
    }


    var providerTierNotes = '';
    if (document.forms[0].elements["TaskSectionReference"].value == "Tier1CompletionDetails") {
        var sCase = window.parent.$('iframe[id=' + activeTier1IframeId + ']').contents().find('title').html().trim();
        var interactiontier1 =  window.parent.$("label:contains('Interaction ID:')").text().split(":")[1].trim();
        var scasetier1interaction = interactiontier1 + " " + sCase;

        if(isAutodocEnabled){
            if(sessionStorage.getItem("campaignName") === "Review Rx Benefits"
                && sessionStorage.getItem('revRxBenScase') === scasetier1interaction) {
                if (sessionStorage.getItem(scasetier1interaction) !== null) {

                    providerTierNotes = sessionStorage.getItem(scasetier1interaction);

                }
                window.parent.$('iframe[id=' + activeTier1IframeId + ']').contents().find('#Comments').val(providerTierNotes);
                sessionStorage.removeItem('revRxBenScase');
                sessionStorage.removeItem(scasetier1interaction);
            }
        }
    }


    var ezcommCore = {
        app: {

            appWindow: null,

            open: function(config) {
                window.parent.localStorage.setItem('EzcommCommunicationsPayload', JSON.stringify(config));

                if (localStorage.getItem("EzcommWindowOpen") === 'true') {
                    window.open("", "a4meEZCommWindow").close();
                }
                window.parent.open("/a4me/ezcomm-core-dev/", "a4meEZCommWindow", 'location=no,height=600,width=1000,scrollbars=1');
            },

            get: function() {
                return this.appWindow;
            }
        }
    };

    function messageEvent(msg) {
        if(msg.data) {
            var data = msg.data.replace("Preference ", "").replace("Override ", "");
            var isNull = false;
            if(window.parent.sessionStorage.getItem(scaseinteraction) === null) {
                window.parent.sessionStorage.setItem(scaseinteraction, data);
                isNull = true;
            } else {
                appendToStorage(scaseinteraction, data);
            }
            return false;
        }
    }


    function appendToStorage(name, data) {
        var old = window.parent.sessionStorage.getItem(name);
        var oldContainer = "";
        if (old === null) {
            old = "";
        }
        oldContainer = old;
        var newAuto = data;
        console.log(newAuto);
        window.parent.sessionStorage.setItem(name, oldContainer += newAuto);
    }

    window.parent.openEzcomm =  function() {

        ezcommCommunications = {
            config: {
                data: {
                    member: {},
                    request_metadata: {}
                }
            }
        };

        ezcommCommunications.config.data.member = getMemberDataMandR();
        ezcommCommunications.config.data.request_metadata = requestMetaDataMandR();
        ezcommCore.app.open(ezcommCommunications.config);

        window.parent.addEventListener("message", messageEvent, false);
    };

    var ezcommButtonVar = setInterval(addEzcommCoreLauncher, 1500);
    function addEzcommCoreLauncher() {
        if (window.parent.$('iframe[id=' + activeTier1IframeId + ']').contents().find("#ezcommLauncherButton").length === 0) {
            window.parent.$('iframe[id=' + activeTier1IframeId + ']').contents().find("#SelPlanID").parent().parent().parent().append(
                '<button id="ezcommLauncherButton" onclick="window.parent.openEzcomm()" type="button" class="pzhc"  ><div class="pzbtn-rnd" ><div class="pzbtn-lft"><div class="pzbtn-rgt" ><div class="pzbtn-mid" ><img src="webwb/zblankimage.gif" alt="" class="pzbtn-i" onclick="window.parent.openEzcomm()">EZComm</div></div></div></div></button>');
        }
    }

}(jQuery, window, document));
