/*
    1. Who has request open for more than 5 days.
    2. Who has approved the merge request not from approvers list
    3. Who has most comments for merge request.

*/
"use strict";
var request = require( "request" ),
    mergedMergeRequests = 'https://code.devops.fds.com/api/v3/projects/2/merge_requests?per_page=50&state=merged&page=',
    openMergeRequests = 'https://code.devops.fds.com/api/v3/projects/2/merge_requests?state=opened&page=',
    allMergedRequests = 'https://code.devops.fds.com/api/v3/projects/2/merge_requests?state=merged&page=',
    approversURL='https://code.devops.fds.com/api/v3/projects/2/merge_request/{{id}}/comments',
    args,   
    gitlabOptions,
    resultLen,
    gitUrls = openMergeRequests + "0",
    gitlabClient = require("./gitlabClient");



/** Merge request and results **/
function callMergeRequest(mergeOptions, callback) {

    return new Promise((resolve, reject) => {
        request.get(mergeOptions.options, (error, response, body) => {
            if (error) { 
                return reject(error); 
            }
          
            if (response.statusCode === 200 && body) {
                resolve(body);
            }
        });
    });
}


var mergedResults = (body, action) => {
    
    var result = JSON.parse(body),
        mergeMap = new Map();

    resultLen = result.length;

    result.map(item => {

        mergeMap.set(item.author.username, {
            "name": item.author.name, 
            "userid": item.author.username, 
            "merge_id": item.iid,
            "assignee": (action == 'merge' && item.assignee) ? item.assignee.name: "",
            "assignee_id": (action == 'merge' && item.assignee ) ? item.assignee.username: "",
            "id": item.id,
            "date": item.created_at,
            "update": item.updated_at                
        });
    });

    return mergeMap;
}




/** Commit request and results **/

function callCommitRequest(commitOptions, callback) {

    return new Promise((resolve, reject) => {
        request.get(commitOptions.options, (error, response, body) => {
            if (error) { 
                return reject(error); 
            }
          
            if (response.statusCode === 200 && body) {
                resolve(body);
            }
        });
    });
}


var approvalResults = (body, mergeItem) => {
    var result = JSON.parse(body);

    if(result.length > gitlabOptions.config.gitlab.MaxNoOfComments){
        console.log( "Merge request ID: " + mergeItem.id + " IID: " + mergeItem.merge_id );
        console.log( "Approver: " + mergeItem.assignee + " " + mergeItem.assignee_id );
        console.log( "Author: " + mergeItem.name + " " + mergeItem.userid );
        console.log( "Created: " + mergeItem.date );
        console.log( "Number of comments = " + result.length);
        console.log("");
    }
 
    result.map(item => {

        if(gitlabOptions.config.approversList.indexOf( item.author.username ) === -1){
            if ( item.note === 'Approved this merge request' ) {
                console.log( "##################### Approver not in approved list #####################" );
                console.log( "Merge request ID: " + mergeItem.id + " IID: " + mergeItem.merge_id );
                console.log( "Approver: " + item.author.name + " " + item.author.username );
                console.log( "Author: " + mergeItem.name + " " + mergeItem.userid );
                console.log( "Created: " + mergeItem.date );
                console.log("--------------------------------------------");
                console.log("");
            }
        }
    });
}

args = process.argv.slice(2)
/* values can be 
 merge
 open
*/

gitUrls = (args[0] == 'merge') ? mergedMergeRequests : openMergeRequests;
gitUrls += "0";
gitlabOptions = gitlabClient.setup({}, {url:gitUrls});


callMergeRequest(gitlabOptions)
    .then( body => {

        return mergedResults(body, args[0]);

    }).then( resultMap => {
        
       var openRequest = Array.from(resultMap).filter( item => 
            parseInt((Date.now() - new Date(item[1].date)) / (1000*60*60*24)) 
            > gitlabOptions.config.gitlab.openDays
        );

        console.log("--------------------------------------------");
        console.log("Open requests ");

        openRequest.forEach(item => {
            let days = parseInt((Date.now() - new Date(item[1].date)) / (1000*60*60*24))
            console.log(item[1].name + ", you have request " +  item[1].merge_id + " open for " + days +" days!");
        });
        console.log("--------------------------------------------");
        console.log("");
        return resultMap;
    }).then( resultMap => {
        var approverOptions = gitlabOptions;
        console.log("Comments count ");
        console.log("--------------------");
        Array.from(resultMap).forEach(item => {
            let mergeid = item[1].id;
            approverOptions.options.url = approversURL.replace( "{{id}}", mergeid );
            approverOptions.options.headers["merge_request_id"] = mergeid;


            callCommitRequest(approverOptions)
            .then( body => {

                return approvalResults(body, item[1]);

            })
            .catch( e => {
                console.log("Commit error - " + e);
            })
        });
    })
    .catch(e => { 
        console.log(e); 
    });


