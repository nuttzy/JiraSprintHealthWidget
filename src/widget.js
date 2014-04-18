/*

to do:
* make URL host configurable
* remove alerts, and replace with some error dialog - have option to fail silently
* consider going OO and dumping the spaghetti code
* unit tests never hurt anyone
* perhaps a dictionary for at least sprint vs mvf language

*/

function getActiveMvfStats( divId, rapidboardId) {
    $("#" + divId).html('<img src="ajax-loader.gif"> Fetching stats from Jira...');
    $.getJSON(getUrl('rapidBoard', rapidboardId), function(results) {
        processRapidboardData(results, divId, rapidboardId)
    });
}

// NOTE: the sprintId can be gotten simply by looking in the URL of the burndown chart
function getCompletedMvfStats( divId, rapidboardId, sprintId) {
    $("#" + divId).html('<img src="ajax-loader.gif"> Fetching stats from Jira...');
    $.getJSON(getUrl('burndownUrl', rapidboardId, sprintId), function(results) {
        var startDate = moment(results.startTime).format('20YY-MM-DD');
        var targetDate = moment(results.completeTime).format('20YY-MM-DD');
        populateCompletedHtml(divId, rapidboardId, startDate, targetDate);
        processBurndownData(results, divId, rapidboardId, sprintId);
        $("#" + divId + " div.UdwHeaderContainer div.Duration span.DurationStart").html(startDate);
        $("#" + divId + " div.UdwHeaderContainer div.Duration span.DurationTarget").html(targetDate);
        $("#" + divId + " div.UdwHeaderContainer div.Duration span.TargetLabel").html("End");
        
    });    
}

function getUrl(urlType, rapidboardId, sprintId) {
    var doItLive = true ;
    var rapidBoardUrl = "rapid_json.html" ;
    var burndownUrl = "mvf199_burndown.html" ;
    if (doItLive) {
        rapidBoardUrl   = "http://jira/rest/greenhopper/1.0/xboard/work/allData.json?rapidViewId=" + rapidboardId + "&jsonp-callback=?" ;
        burndownUrl     = "http://jira/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart.json?rapidViewId=" + rapidboardId + "&sprintId=" + sprintId + "&jsonp-callback=?" ;
    }    
    
    if (urlType == 'rapidBoard') {
        return rapidBoardUrl ;
    } else {
        return burndownUrl ;
    }
}

function getHeaderHtml() {
    return '\
        <div class="UdwHeaderContainer"> \
            <div><span class="DaysLeft">0 days left</span><span class="PointsPerWeek"></span></div> \
            <div class="Duration"> \
                <span class="DurationLabel">Start:</span><span class="DurationStart DurationValue">2014-01-01</span> <span class="DurationLabel TargetLabel">Target:</span><span class="DurationTarget DurationValue">2014-02-01</span> \
            </div> \
        </div> \
     ';
}

function getProgressBarHtml(sprintId) {
    return '\
        <div class="UdwColumnProgressContainer"> \
            <ul class="UdwColumnProgress"> \
                <li class="UdwProgress AnalysisComplete" style="width:25%"> \
                    <a title="Analysis Complete" href="http://jira/issues/?jql=status%20in%20%28%22Reopened%22%2C%22Open%22%29%20AND%20Sprint%20%3D%20' + sprintId + '" target="_blank" class="UdwProgressStatusInfo"> \
                        <b>0</b> \
                    </a> \
                </li> \
                <li class="UdwProgress Implementation" style="width:25%"> \
                    <a title="Implementation" href="http://jira/issues/?jql=status%20in%20%28%22Implementation%20Parking%20Lot%22%2C%22In%20Progress%22%29%20AND%20Sprint%20%3D%20' + sprintId + '" target="_blank" class="UdwProgressStatusInfo"> \
                        <b>0</b> \
                    </a> \
                </li> \
                <li class="UdwProgress Verification" style="width:25%"> \
                    <a title="Verification" href="http://jira/issues/?jql=status%20in%20%28%22Verification%20Parking%20Lot%22%2C%22Verification%22%29%20AND%20Sprint%20%3D%20' + sprintId + '" target="_blank" class="UdwProgressStatusInfo"> \
                        <b>0</b> \
                    </a> \
                </li> \
                <li class="UdwProgress ReleaseReady" style="width:25%; text-align:bottom;"> \
                    <a title="Release Ready" href="http://jira/secure/IssueNavigator.jspa?reset=true&jqlQuery=status%20in%20(%22Closed%22,%22Resolved%22)%20AND%20Sprint%20=%20' + sprintId + '" target="_blank" class="UdwProgressStatusInfo"> \
                        <b>0</b> \
                    </a> \
                </li> \
            </ul> \
        </div> \
    ';
}

function getActiveFooterHtml(rapidboardId, startDate, targetDate) {
    return '\
        <div class="UdwFooterContainer"> \
            <div class="UdwPercentUpdatesContainer"> \
                <div class="PercentContainer TimeElapsed"> \
                    <div class="UdwPercentValue">0%</div> \
                    <div class="UdwPercentLabel">Time Elapsed</div> \
                </div> \
                <div class="PercentContainer WorkComplete"> \
                    <div class="UdwPercentValue">0%</div> \
                    <div class="UdwPercentLabel">Work Complete</div> \
                </div> \
                <div class="PercentContainer ScopeChange"> \
                    <div class="UdwPercentValue"><img src="ajax-loader.gif"></div> \
                    <div class="UdwPercentLabel">Scope Change</div> \
                </div> \
            </div> \
            <div class="UdwNavContainer"> \
                <div><a target="_blank" href="http://jira/secure/RapidBoard.jspa?rapidView=' + rapidboardId + '">Kanban</a> | <a target="_blank" href="http://jira/secure/RapidBoard.jspa?rapidView=' + rapidboardId + '&view=reporting&chart=burndownChart">Burndown</a> | <a target="_blank" href="http://jira/secure/RapidBoard.jspa?rapidView=' + rapidboardId + '&view=reporting&chart=cumulativeFlowDiagram&from=' + startDate + '&to=' + targetDate + '">CFD</a> | <a class="info" href="javascript:alert(\'Help dialog to be constructed.\')"><img alt="More Info" title="More Info" src="info.png" style="heigh:20px;width:20px;vertical-align:bottom;"></a></div> \
            </div> \
        </div> \
    ';
}

function getCompletedFooterHtml(rapidboardId, startDate, targetDate) {
    return '\
        <div class="UdwFooterContainer"> \
            <div class="UdwPercentUpdatesContainer"> \
                <div class="PercentContainer PlannedUnits"> \
                    <div class="UdwPercentValue">0</div> \
                    <div class="UdwPercentLabel">Planned Units</div> \
                </div> \
                <div class="PercentContainer RevisedUnits"> \
                    <div class="UdwPercentValue">0</div> \
                    <div class="UdwPercentLabel">Revised Units</div> \
                </div> \
                <div class="PercentContainer ScopeChange"> \
                    <div class="UdwPercentValue"><img src="ajax-loader.gif"></div> \
                    <div class="UdwPercentLabel">Scope Change</div> \
                </div> \
            </div> \
            <div class="UdwNavContainer"> \
                <div><a target="_blank" href="http://jira/secure/RapidBoard.jspa?rapidView=' + rapidboardId + '&view=reporting&chart=controlChart&from=' + startDate + '&to=' + targetDate + '">Control</a> | <a target="_blank" href="http://jira/secure/RapidBoard.jspa?rapidView=' + rapidboardId + '&view=reporting&chart=burndownChart">Burndown</a> | <a target="_blank" href="http://jira/secure/RapidBoard.jspa?rapidView=' + rapidboardId + '&view=reporting&chart=cumulativeFlowDiagram&from=' + startDate + '&to=' + targetDate + '">CFD</a> | <a class="info" href="javascript:alert(\'Help dialog to be constructed.\')"><img alt="More Info" title="More Info" src="info.png" style="heigh:20px;width:20px;vertical-align:bottom;"></a></div> \
            </div> \
        </div> \
    ';
}

function populateActiveHtml(divId, rapidboardId, sprintId, startDate, targetDate) {
    $("#" + divId + "").html( getHeaderHtml() + getProgressBarHtml(sprintId) +  getActiveFooterHtml(rapidboardId, startDate, targetDate) );
}

function populateCompletedHtml(divId, rapidboardId, startDate, targetDate) {
    $("#" + divId + "").html( getHeaderHtml() + '<br/>' +  getCompletedFooterHtml(rapidboardId, startDate, targetDate) );
    
    var weeksToComplete = Math.round(moment(targetDate).diff(moment(startDate),'days')/7*10)/10;
    $("#" + divId + " div.UdwHeaderContainer span.DaysLeft").html( weeksToComplete + ' weeks to complete');
}

function handleClosedSprint(divId) {
    $("#" + divId).html('The MVF has been completed.  Use the getCompletedMvfStats() call to see stats.');
}

function processRapidboardData(result, divId, rapidboardId) {
    if (result.sprintsData.sprints.length == 0) {
        handleClosedSprint(divId) ;
        return ;
    }
    var sprintId = result.sprintsData.sprints[0].id;
    var startDate = moment(result.sprintsData.sprints[0].startDate).format('20YY-MM-DD');
    var targetDate = moment(result.sprintsData.sprints[0].endDate).format('20YY-MM-DD');
    populateActiveHtml(divId, rapidboardId, sprintId, startDate, targetDate);
    $.getJSON(getUrl('burndownUrl', rapidboardId, sprintId), function(results) {
        processBurndownData(results, divId, rapidboardId, sprintId)
    });

    var pointsAnalysis = 0;
    var pointsImplementation = 0;
    var pointsVerification = 0;
    var pointsReleaseReady = 0;
    var totalPoints = 0 ;
    $.each(result.issuesData.issues, function(i, field){
        if (field.typeName == "Story") {
            switch (field.statusName) {
            case "Open":
            case "Reopened":
                pointsAnalysis = pointsAnalysis + field.estimateStatistic.statFieldValue.value;
                break;
            case "In Progress":
            case "Implementation Parking Lot":
                pointsImplementation = pointsImplementation + field.estimateStatistic.statFieldValue.value;
                break;
            case "Verification":
            case "Verification Parking Lot":
                pointsVerification = pointsVerification + field.estimateStatistic.statFieldValue.value;
                break;
            case "Resolved":
            case "Closed":
                pointsReleaseReady = pointsReleaseReady + field.estimateStatistic.statFieldValue.value;
                break;
default: alert("wtf");
            }
            
            totalPoints = totalPoints + field.estimateStatistic.statFieldValue.value;
        }
    });
    $("#" + divId + " li.AnalysisComplete a b").html(pointsAnalysis);
    $("#" + divId + " li.Implementation a b").html(pointsImplementation);
    $("#" + divId + " li.Verification a b").html(pointsVerification);
    $("#" + divId + " li.ReleaseReady a b").html(pointsReleaseReady);

    if (totalPoints != 0) {
        $("#" + divId + " li.AnalysisComplete").css("width",pointsAnalysis/totalPoints*100 + "%");
        $("#" + divId + " li.Implementation").css("width",pointsImplementation/totalPoints*100 + "%");
        $("#" + divId + " li.Verification").css("width",pointsVerification/totalPoints*100 + "%");
        $("#" + divId + " li.ReleaseReady").css("width",pointsReleaseReady/totalPoints*100 + "%");
    }
    $("#" + divId + " div.UdwFooterContainer div.WorkComplete div.UdwPercentValue").html(Math.round(pointsReleaseReady/totalPoints*100) + "%");            

    $("#" + divId + " div.UdwHeaderContainer div.Duration span.DurationStart").html(startDate);
    $("#" + divId + " div.UdwHeaderContainer div.Duration span.DurationTarget").html(targetDate);
    $("#" + divId + " div.UdwHeaderContainer span.DaysLeft").html(
        moment(targetDate).diff(moment(),'days') + " days left"
     );
    var totalDays = moment(targetDate).diff(moment(startDate),'days');
    var daysElapsed = moment().diff(startDate,'days') ;
    $("#" + divId + " div.UdwFooterContainer div.TimeElapsed div.UdwPercentValue").html(Math.round(daysElapsed/totalDays*100) + "%");            

}

function processBurndownData(result, divId, rapidboardId, sprintId) {
    var startTime = result.startTime;
    var originalScope = 0;
    var endScope = 0;
    var stories = [] ;
    var keys = [] ;
    var delta = 0;
    $.each(result.changes, function(changeTime, field){
        // determine scope start
        if (typeof field[0].statC != 'undefined' && typeof field[0].statC.newValue != 'undefined' && changeTime <= startTime) {
            // typical case of adding a new story to the sprint before the MVF is kicked off
            if (keys.indexOf(field[0].key) == -1) {
                originalScope = originalScope + field[0].statC.newValue ;
                keys.push(field[0].key) ;
                stories.push({"key":field[0].key,"points":field[0].statC.newValue});
            // odd case of modifying the story points before MVF kicks off
            } else {
                // not sure if this could ever happen, but if it does, I think we want to update the value if it is non-zero
                delta = stories[keys.indexOf(field[0].key)].points - field[0].statC.oldValue ;
                originalScope = originalScope + delta ;                        
                stories[keys.indexOf(field[0].key)].points = field[0].statC.newValue;
            }
        // handles changes after scope start                
        } else if (typeof field[0].statC != 'undefined' && typeof field[0].statC.newValue != 'undefined') {
            // handle new story added
            if (keys.indexOf(field[0].key) == -1) {
                endScope = endScope + field[0].statC.newValue ;
                keys.push(field[0].key) ;
                stories.push({"key":field[0].key,"points":field[0].statC.newValue});
            // handle change in scope: we are expecting both a new and old value to be present, otherwise not sure what this!
            } else if (typeof field[0].statC.oldValue != 'undefined') {
                delta = stories[keys.indexOf(field[0].key)].points - field[0].statC.oldValue ;
                endScope = endScope + delta ;                        
                stories[keys.indexOf(field[0].key)].points = field[0].statC.newValue;            
            } else {
alert("unexecpted condition for " + field[0].key) ;
            }
        // handle case of removing story from sprint
        } else if (typeof field[0].added != 'undefined' && field[0].added === false) {
            // sprint not started
            if (changeTime <= startTime) {
                originalScope = originalScope - stories[keys.indexOf(field[0].key)].points;
                stories[keys.indexOf(field[0].key)].points = 0;                
            // sprint has started
            } else {
                endScope = endScope - stories[keys.indexOf(field[0].key)].points;
                stories[keys.indexOf(field[0].key)].points = 0;                
            }
        }
        
        if (changeTime <= startTime) {
            endScope = originalScope;
        }
    });
    $("#" + divId + " div.UdwFooterContainer div.PlannedUnits div.UdwPercentValue").html(originalScope);            
    $("#" + divId + " div.UdwFooterContainer div.RevisedUnits div.UdwPercentValue").html(endScope);            
    
    if (endScope!=0) {
        $("#" + divId + " div.UdwFooterContainer div.ScopeChange div.UdwPercentValue").html(Math.round((endScope-originalScope)/endScope*100) + "%");            
    // handle divide by zero
    } else {
        $("#" + divId + " div.UdwFooterContainer div.ScopeChange div.UdwPercentValue").html("0%");            
    }
    
    var startDate = moment(result.startTime).format('20YY-MM-DD');
    var targetDate = moment(result.completeTime).format('20YY-MM-DD');
    var weeksToComplete = Math.round(moment(targetDate).diff(moment(startDate),'days')/7*10)/10;
    var perWeek = Math.round(endScope / weeksToComplete * 10)/10 ;
    $("#" + divId + " div.UdwHeaderContainer span.PointsPerWeek").html('(' + perWeek + '/wk)');
}
