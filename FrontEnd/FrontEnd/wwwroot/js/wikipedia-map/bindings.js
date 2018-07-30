// This script contains (most of) the code that binds actions to events.

var nowClickEdge = "";
var nowClickEdgePathIndex = 0;
var lastChoosePath = [];

//Functions that will be used as bindings
function expandEvent(params) { // Expand a node (with event handler)
    if (params.nodes.length) { //Did the click occur on a node?
        var nodeId = params.nodes[0]; //The id of the node clicked
        console.log("Node click");
        console.log(nodes.get(nodeId))
        nd = nodes.get(nodeId);
        if (!nd.isExpand) {
            //nodes.update({ id: nodeId, isExpand: true });

            if (!nd.isMethod) {
                console.log("Expand");
                expandNode(nodeId);
            }
            nd.isExpand = true;
            nodes.update(nd);
        } 
        //// open 
        //var id = nodes.get(nodeId).id;
        //var url;
        //if (nodes.get(nodeId).isMethod) {
        //    url = nodes.get(nodeId).url;
        //} else {
        //    url = apiproxy.getEntity(id)["url"];
        //}

        //console.log("url----->" + url);
        //window.open(url, '_blank');

        //} else {
        // nodes.update({ id: nodeId, isExpand: false });
        //console.log('remove');
        // }

    }
}


function mobileTraceEvent(params) { // Trace back a node (with event handler)
    if (params.nodes.length) { //Was the click on a node?
        //The node clicked
        var page = params.nodes[0];
        //Highlight in blue all nodes tracing back to central node
        traceBack(page);
    } else {
        resetProperties();
    }
}

function openPageEvent(params) {
    if (params.nodes.length) {
        var nodeid = params.nodes[0];
        var id = nodes.get(nodeid).id;
        var url;
        if (nodes.get(nodeid).isMethod) {
            url = nodes.get(nodeid).url;
        } else {
            url = apiproxy.getEntity(id)["url"];
        }

        console.log("url----->" + url);
        window.open(url, '_blank');
    }
}

// Bind the network events
function bindNetwork() {
    if (isTouchDevice) { // Device has touchscreen
        network.on("hold", expandEvent); // Long press to expand
        //network.on("selectNode", mobileTraceEvent); // Highlight traceback on click
    } else { // Device does not have touchscreen
        network.on("click", onCilck);
        //network.on("selectNode", expandEvent); // Expand on click
        network.on("hoverNode", function (params) { // Highlight traceback on hover
            traceBack(params.node);
        });
        network.on("blurNode", resetProperties); // un-traceback on un-hover
    }

    //Bind double-click to open page
    network.on("doubleClick", openPageEvent);
    //network.on("selectEdge", function (params) {
    //    edgeTraceBack(params);
    //});
}

function onCilck(params) {
    //console.log(params);
    unHighlightPath(lastChoosePath);
    if (params.nodes.length != 0) {
        expandEvent(params);
        return;
    }
    if (params.edges.length != 0) {
        edgeTraceBack(params);
        return;
    }
    

}

// show the api on diffient paths
function edgeTraceBack(params) {
    console.log("Edge click");
    console.log(edges.get(params.edges[0]));
    var edgeId = params.edges[0];
    var paths = getAPIPaths(edgeId);
    var startNode = [edges.get(edgeId).to];
    // add start node
    for (var i = 0; i < paths.length; i++) {
        paths[i] = startNode.concat(paths[i]);
        paths[i].reverse();
    }
    console.log(paths);
    if (nowClickEdge == edgeId) {
        //console.log('next');
        //paths = getAPIPaths();
        if (nowClickEdgePathIndex == paths.length) {
            nowClickEdgePathIndex = 0;
        }
        //unHighlightPath(lastChoosePath);
        highlightPath(paths[nowClickEdgePathIndex]);
        showApi(paths[nowClickEdgePathIndex]);
        lastChoosePath = paths[nowClickEdgePathIndex];
        nowClickEdgePathIndex = nowClickEdgePathIndex + 1;
    } else {
        nowClickEdge = edgeId;
        nowClickEdgePathIndex = 0;
        //unHighlightPath(lastChoosePath);
        highlightPath(paths[nowClickEdgePathIndex]);
        showApi(paths[nowClickEdgePathIndex]);
        lastChoosePath = paths[nowClickEdgePathIndex];
        nowClickEdgePathIndex = nowClickEdgePathIndex + 1;
    }

}

function showApi(path) {
    var apiLog = document.getElementById('apiLog');
    var apiUrl = "https://graph.microsoft.coml";
    for (var i = 1; i < path.length -1; i++) {
        if (i % 2 == 0) {
            apiUrl = apiUrl + '/' + path[i];
        }
    }
    apiLog.innerHTML = apiUrl;
}
// highlight path
function highlightPath(path) {
    for (var i = 0; i < path.length; i++) {
        if (i % 2 == 0) {
            //console.log(i);
            colorNode(nodes.get(path[i]), 1);
        } else {
            // first line need thin
            if (i == path.length - 2) {
                colorEdge(edges.get(path[i]), 1, 1);
            } else {
                colorEdge(edges.get(path[i]), 1, 3);
            }
        }
    }
}

// un highlight path

function unHighlightPath(path) {
    for (var i = 0; i < path.length; i++) {
        if (i % 2 == 0) {
            //console.log(i);
            colorNode(nodes.get(path[i]), 0);
        } else {
           
            if (i == 1) {
                colorEdge(edges.get(path[i]), 0, 1);
            } else {
                colorEdge(edges.get(path[i]), 0, 1);
            }
        }
    }
}

function colorEdge(es, color, width) {
    if (color) {
        es.width = width;
        es.color = "#FF0000"
    } else {
        es.width = width;
        es.color = "#03A9F4"
    }
    edges.update(es);
}

// Color node from a list based on their level. If color=1, highlight color will be used.
function colorNode(ns, color) {
    var colorFunc
    if (ns.isDefault) {
        colorFunc = color ? getYellowColor : getDefaultColor;
    } else {
        if (ns.isAim) {
            colorFunc = color ? getYellowColor : getAimColor;
        } else {
            if (ns.isMethod) {
                colorFunc = color ? getYellowColor : getMethodColor;
            } else {
                colorFunc = color ? getYellowColor : getColor;
            }
        }
    }
    ns.color = colorFunc(ns.level);
    delete ns.x;
    delete ns.y;
    nodes.update(ns);
}

// get all path to edge
function getAPIPaths(edgeId) {
    var daId = apiproxy.getDefaultEntity()['id'];
    if (edges.get(edgeId).from == daId) {
        var paths = [[edgeId, daId]];
        return paths;
    } else {
        console.log(edges.get(edgeId));
        var nodeId = edges.get(edgeId).from;
        var node = nodes.get(nodeId);
        console.log(nodeId);
        console.log(node);
        var parents = node.parents;
        var tempPath = [edgeId, nodeId];
        var paths = [];
        for (var i = 0; i < parents.length; i++) {
            var prePaths = getAPIPaths(edges.get(getEdgeId(parents[i], nodeId)).id);
            for (var j = 0; j < prePaths.length; j++) {
                //console.log(tempPath.concat(prePaths[j]));
                paths.push(tempPath.concat(prePaths[j]));
            }
        }
        return paths;
    }
}

function bind() {

    // Prevent iOS scrolling
    document.ontouchmove = function (event) {
        event.preventDefault();
    };

    // Bind actions for search component.

    var cf = document.getElementsByClassName("commafield")[0];
    //Bind the action of pressing the button
    var submitButton = document.getElementById('submit');
    submitButton.onclick = function () {
        shepherd.cancel(); // Dismiss the tour if it is in progress
        resetNetworkFromInput();
    };

    var randomButton = document.getElementById('random');
    randomButton.onclick = randomReset;

    //start
    //var tourbtn = document.getElementById("tourinit");
    //tourbtn.onclick = function(){shepherd.start();};
    //init default
    resetNetworkFromInputDefault();

    // Bind GitHub button
    var ghbutton = document.getElementById("github");
    ghbutton.onclick = function (event) {
        window.open("https://github.com/docascode/graph_toc");
    };

    // Bind twitter button
    var sharebutton = document.getElementById("share");
    var buttons = document.getElementById("buttons");
    sharebutton.onclick = function (event) {

    };
}
