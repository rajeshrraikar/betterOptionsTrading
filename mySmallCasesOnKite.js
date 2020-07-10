// ==UserScript==
// @name         mySmallCasesOnKite
// @namespace    http://mySmallCasesOnKite.net/
// @version      0.1
// @description  Introduces small features on top of kite app
// @author       Amit
// @match        https://kite.zerodha.com/*
// @grant        none
// ==/UserScript==

// a function that loads jQuery and calls a callback function when jQuery has finished loading
function addJQuery(callback) {
  var script = document.createElement("script");
  script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js");
  script.addEventListener('load', function() {
    var script = document.createElement("script");
    script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
    document.body.appendChild(script);
  }, false);
  document.body.appendChild(script);

    var style = document.createElement("style");
    style.textContent = `
randomClassToHelpHide {outline: 1px dotted green;}
tagSelectorStyle {
margin: 15px 0;margin-top: 15px;margin-right: 0px;margin-bottom: 15px;margin-left: 0px;
border-right: 1px solid #e0e0e0;border-right-width: 1px;border-right-style: solid;border-right-color: rgb(224, 224, 224);
}
`;
    //only for debuggin- document.body.appendChild(style);
}

// the guts of this userscript
function main() {

  /* replace <<< REPLACE HOLDINGS>>> below with your array (example below)
    var holdings = {
      "Dividend" : ["SJVN","VEDL"],
      "Wealth Creators" : ["WHIRLPOOL","ICICIBANK",],
      "Sell On profit" : ["LUMAXIND","RADICO","M&amp;M"]
    };

    //Note: if script name as & then write it as &amp;
  */
   <<< REPLACE HOLDINGS>>>

    /* replace <<< REPLACE POSITIONS>>> below with your array (example below)
     var positions = {
      "BajajFinance" : ["12304386","12311298","12313858","12314370"],
      "Bata": ["12431106"]
     };
   */
    <<< REPLACE POSITIONS>>>

    /* If you want to tag your reference trades separately, provide traide Ids in the array.
    Example below.
     var referenceTrades = [
        "12304386","10397698", "10233602", "10237186"
    ];

    //note other variables start and end with {} but this one with []
    By default array is empty.
   */
    var referenceTrades = [];

    var D_LEVEL_INFO = 2;
    var D_LEVEL_DEBUG = 1;

    var D_LEVEL = D_LEVEL_INFO;

    var allDOMPaths = {
        rowsFromHoldingsTable : "div.holdings > section > div > div > table > tbody > tr",
        attrNameForInstrumentTR : "data-uid",
        domPathWatchlistRow : "div.instruments > div > div.vddl-draggable.instrument",
        domPathPendingOrdersTR : "div.pending-orders > div > table > tbody > tr",
        domPathExecutedOrdersTR : "div.completed-orders > div > table > tbody > tr",
        domPathTradingSymbolInsideOrdersTR : "span.tradingsymbol > span",
        domPathStockNameInWatchlistRow : "span.nice-name",
        domPathMainInitiatorLabel : "h3.page-title.small > span",
        domPathTabToChangeWatchlist : "ul.marketwatch-selector.list-flat > li",
        PathForPositions : "div.positions > section.open-positions.table-wrapper > div > div > table > tbody > tr",
        positionHeader: "header.row.data-table-header"
    };


    var log = function(level, logInfo) {
        if (level >= D_LEVEL) {
            console.log(logInfo);
        }
    }
    var debug = function(logInfo) {
        log( D_LEVEL_DEBUG , logInfo);
    }
    var info = function(logInfo) {
        log( D_LEVEL_INFO , logInfo);
    }

    //crete the dropdown to filter stocks.
    var dropdown = function(){
        var selectBox = document.createElement("SELECT");
        selectBox.id = "tagSelector";
        selectBox.classList.add("randomClassToHelpHide");
        selectBox.style="margin: 15px 0;margin-top: 15px;margin-right: 0px;margin-bottom: 15px;margin-left: 0px;"

        var option = document.createElement("option");
        option.text = "All";
        option.value= "All";
        selectBox.add(option);
        selectBox.addEventListener("change", function() {
            var selectedCat = this.value;

            info("Tag selected: " + selectedCat);
            var selectedStocks = holdings[selectedCat];

            var currentUrl = window.location.pathname;
            info(currentUrl);
            if (currentUrl.includes('holdings')) {

                //START work on Holdings AREA
                var allHoldingrows = jQ(allDOMPaths.rowsFromHoldingsTable);
                info('found holdings row: ' + allHoldingrows.lenth);
                allHoldingrows.show();
                if (selectedCat === "All") {
                    jQ("#stocksInTagCount").text("");
                    //don't do anything
                } else {
                    //logic to hide the rows in Holdings table not in our list
                    var countHoldingsStocks = 0;
                    allHoldingrows.addClass("allHiddenRows");

                    var pnl = 0;
                    allHoldingrows.each(function(rowIndex) {
                        var dataUidInTR = this.getAttribute(allDOMPaths.attrNameForInstrumentTR);
                        if (dataUidInTR.includes("-BE")) {
                            dataUidInTR = dataUidInTR.split("-BE")[0];
                        } else if (dataUidInTR.includes("NSE")) {
                            dataUidInTR = dataUidInTR.split("NSE")[0];
                        } else if (dataUidInTR.includes("BSE")) {
                            dataUidInTR = dataUidInTR.split("BSE")[0];
                        }

                        var matchFound = false;
                        matchFound = selectedStocks.includes(dataUidInTR);

                        if (matchFound) {
                            //dont do anything, let the row be shown.
                            countHoldingsStocks++;
                            pnl += parseFloat(jQ(jQ(this).find("td")[5]).text().replace(",",""));
                        } else {
                            jQ(this).hide();
                        }
                    });

                    jQ("#stocksInTagCount").text("("+countHoldingsStocks+") " + pnl.toFixed(2).toLocaleString());

                }

                //check if tags are present
                var tagNameSpans = jQ("span[random-att='tagName']");
                info('no of tags found: ' + tagNameSpans.length);
                if (tagNameSpans.length < 1) {

                    //add label indicating category of stock
                    jQ("td.instrument.right-border > span").each(function(rowIndex){

                        var displayedStockName = this.innerHTML;

                        for(var categoryName in holdings){
                            if (displayedStockName.includes("-BE")) {
                                displayedStockName = displayedStockName.split("-BE")[0];
                            }

                            debug("stock name trying to tag: " + displayedStockName);
                            if (holdings[categoryName].includes(displayedStockName)) {
                                jQ(this).append("<span random-att='tagName' class='randomClassToHelpHide'>&nbsp;</span><span class='text-label blue randomClassToHelpHide'>"+categoryName+"</span>");
                            }
                        };

                    });
                } else {debug('tags found');}
                //END work on Holdings AREA
            } else if (currentUrl.includes('orders')) {
                //START work on order AREA
                var allPendingOrderRows = jQ(allDOMPaths.domPathPendingOrdersTR);

                var allExecutedOrderRows = jQ(allDOMPaths.domPathExecutedOrdersTR);
                allPendingOrderRows.show();
                allExecutedOrderRows.show();

                info("pending orders: " + allPendingOrderRows.length);

                if (selectedCat === "All") {
                    //don't do anything
                } else {
                    var countPendingOrdersStocks = 0;
                    allPendingOrderRows.addClass("allHiddenRows");
                    allPendingOrderRows.each(function(rowIndex){
                        var workingRow = this;
                        var stockInRow = jQ(workingRow).find(allDOMPaths.domPathTradingSymbolInsideOrdersTR).html();
                        debug("found pending order: " + stockInRow);
                        if (stockInRow.includes("-BE")) {
                            stockInRow = stockInRow.split("-BE")[0];
                        }
                        var matchFound = false;
                        matchFound = selectedStocks.includes(stockInRow);

                        if (matchFound) {
                            //do nothing
                            countPendingOrdersStocks++;
                        } else {
                            jQ(workingRow).hide();
                        }
                    });

                    jQ("#stocksInTagCount").text("("+countPendingOrdersStocks+") ");

                    allExecutedOrderRows.addClass("allHiddenRows");
                    allExecutedOrderRows.each(function(rowIndex){
                        var workingRow = this;
                        var stockInRow = jQ(workingRow).find(allDOMPaths.domPathTradingSymbolInsideOrdersTR).html();
                        debug("found executed order: " + stockInRow);
                        if (stockInRow.includes("-BE")) {
                            stockInRow = stockInRow.split("-BE")[0];
                        }
                        var matchFound = false;
                        matchFound = selectedStocks.includes(stockInRow);

                        if (matchFound) {
                            //do nothing
                        } else {
                            jQ(workingRow).hide();
                        }
                    });

                }
                //END work on order AREA
            }

            //START work on watchlist AREA
            var allWatchlistRows = jQ(allDOMPaths.domPathWatchlistRow);
            allWatchlistRows.show();
            if (selectedCat === "All") {
                //don't do anything
            } else {
                allWatchlistRows.addClass("allHiddenRows");

                allWatchlistRows.each(function(rowIndex){
                    var watchlistRowDiv = this;
                    var stockName = jQ(watchlistRowDiv).find(allDOMPaths.domPathStockNameInWatchlistRow);
                    var watchlistStock = stockName.html();
                    if (watchlistStock.includes("-BE")) {
                        watchlistStock = watchlistStock.split("-BE")[0];
                    }
                    var matchFound = false;
                    matchFound = selectedStocks.includes(watchlistStock);

                    if (matchFound) {
                        //do nothing
                    } else {
                        jQ(watchlistRowDiv).hide();
                    }
                });
            }
            //END work on watchlist AREA

            return this;
        });

        for(var key in holdings){
            option = document.createElement("option");
            option.text = key;
            option.value = key;
            selectBox.add(option);
        };
        return selectBox;
    }();

    var positionGroupdropdown = function(){
        var selectBox = document.createElement("SELECT");
        selectBox.id = "tagSelector";
        selectBox.classList.add("randomClassToHelpHide");
        selectBox.style="margin: 15px 0;margin-top: 15px;margin-right: 0px;margin-bottom: 15px;margin-left: 0px;"

        var option = document.createElement("option");
        option.text = "All";
        option.value= "All";
        selectBox.add(option);
        selectBox.addEventListener("change", function() {
            var selectedGroup = this.value;

            info("Group selected: " + selectedGroup);
            var selectedPositions = positions[selectedGroup];

            var currentUrl = window.location.pathname;
            info(currentUrl);
            if (currentUrl.includes('positions')) {

                //START work on Positions AREA
                var allPositionsRow = jQ(allDOMPaths.PathForPositions);
                info('found positions row: ' + allPositionsRow.lenth);
                allPositionsRow.show();

                var allPositionOnKite = [];

                if (selectedGroup === "All") {
                    jQ("#stocksInTagCount").text("");
                    //don't do anything
                } else {
                    //logic to hide the rows in Holdings table not in our list
                    var countHoldingsStocks = 0;
                    allPositionsRow.addClass("allHiddenRows");

                    var pnl = 0;
                    allPositionsRow.each(function(rowIndex) {
                        var dataUidInTR = this.getAttribute(allDOMPaths.attrNameForInstrumentTR);
                        var p = dataUidInTR.split(".")[1];
                        allPositionOnKite.push(p);

                        var matchFound = false;

                        matchFound = selectedPositions.includes(p);


                        if (matchFound) {
                            //dont do anything, let the row be shown.
                            countHoldingsStocks++;
                            pnl += parseFloat(jQ(jQ(this).find("td")[6]).text().replace(",",""));

                            var tagNameSpans = jQ(this).find("span[random-att='tagName']");

                            if (tagNameSpans.length < 1) {
                                if (referenceTrades.includes(p)) {
                                    jQ(this).find("span.exchange.text-xxsmall.dim").append("<span random-att='tagName' class='randomClassToHelpHide'>&nbsp;</span><span class='text-label blue randomClassToHelpHide'>RF</span>");
                                }
                            }

                        } else {
                            jQ(this).hide();
                        }



                    });
                    jQ("#stocksInTagCount").text(pnl.toFixed(2).toLocaleString());
                }

                //marking positions part of a group
                debug('missing positions are: ');
                var arrPositionsInOurArray = [];
                for(var strategies in positions){
                    arrPositionsInOurArray.push(...positions[strategies]);
                };
                var t = allPositionOnKite.filter(function(x) {
                    return !arrPositionsInOurArray.includes(x);
                })
                debug(t);

                //END work on Positions AREA
            }

            return this;
        });

        for(var key in positions){
            option = document.createElement("option");
            option.text = key;
            option.value = key;
            selectBox.add(option);
        };
        return selectBox;
    }();

    jQ(document).on('click', allDOMPaths.positionHeader, function () {
        var currentUrl = window.location.pathname;
        if (currentUrl.includes('positions')) {
            if (jQ(".randomClassToHelpHide").length) {
                jQ(".randomClassToHelpHide").remove();
                jQ(".allHiddenRows").show();
            } else {
                jQ("a.logo")[0].after(positionGroupdropdown);

                var spanForCount = document.createElement("span");
                spanForCount.classList.add("randomClassToHelpHide");
                spanForCount.classList.add("tagSelectorStyle");
                spanForCount.style="margin: 15px 0;margin-top: 15px;margin-right: 0px;margin-bottom: 15px;margin-left: 0px;border-right: 1px solid #e0e0e0;border-right-width: 1px;border-right-style: solid;border-right-color: rgb(224, 224, 224);padding: 0 10px;"

                spanForCount.id ='stocksInTagCount';
                jQ(positionGroupdropdown).after(spanForCount);

                simulateSelectBoxEvent();
            }
        }
    });

    jQ(document).on('click',allDOMPaths.PathForPositions, function() {
        var dataUidInTR = this.getAttribute(allDOMPaths.attrNameForInstrumentTR);

        var text = dataUidInTR.split(".")[1];
        navigator.clipboard.writeText(text).then(function() {
            debug('Async: Copying to clipboard was successful!');
        }, function(err) {
            debug('Async: Could not copy text: ', err);
        });
    });

    jQ(document).on('click', allDOMPaths.domPathMainInitiatorLabel, function () {
        // jQuery methods go here...
        if (jQ(".randomClassToHelpHide").length) {
            jQ(".randomClassToHelpHide").remove();
            jQ(".allHiddenRows").show();
        } else {
            //jQ("h3.page-title.small")[0].before(dropdown);
            jQ("a.logo")[0].after(dropdown);

            var spanForCount = document.createElement("span");
            spanForCount.classList.add("randomClassToHelpHide");
            spanForCount.classList.add("tagSelectorStyle");
            spanForCount.style="margin: 15px 0;margin-top: 15px;margin-right: 0px;margin-bottom: 15px;margin-left: 0px;border-right: 1px solid #e0e0e0;border-right-width: 1px;border-right-style: solid;border-right-color: rgb(224, 224, 224);padding: 0 10px;"

            spanForCount.id ='stocksInTagCount';
            jQ(dropdown).after(spanForCount);

            simulateSelectBoxEvent();
        }
    });

    //dspatch tagSelector change event.
    var simulateSelectBoxEvent = function() {
        debug('simulating tagSelector change ');

        var tagSelector = document.querySelector("#tagSelector");
        if (tagSelector) {
            var currentUrl = window.location.pathname;
            debug("simulateSelectBoxEvent: currentURL " + currentUrl);
            if (currentUrl.includes('holdings')) {
                var allHoldingrows = jQ(allDOMPaths.rowsFromHoldingsTable);
                if (allHoldingrows.length > 0) {
                    debug('initiating change event found holdings');
                    tagSelector.dispatchEvent(new Event("change"));
                } else {
                    debug('sleeping as couldnt find holding');
                    setTimeout(function(){ simulateSelectBoxEvent(); }, 1000);
                }
            } else if (currentUrl.includes('positions')) {
                var allPositionsRows = jQ(allDOMPaths.PathForPositions);
                if (allPositionsRows.length > 0) {
                    debug('initiating change event found holdings');
                    tagSelector.dispatchEvent(new Event("change"));
                } else {
                    debug('sleeping as couldnt find positions');
                    //setTimeout(function(){ simulateSelectBoxEvent(); }, 1000);
                    setTimeout(function(){tagSelector.dispatchEvent(new Event("change")); }, 2000);
                }
            } else if (currentUrl.includes('orders')) {
                debug('this is just a work aroud. First order dom for order is accessible after few sec');
                if (jQ(allDOMPaths.domPathPendingOrdersTR).length < 1 && jQ(allDOMPaths.domPathExecutedOrdersTR).length < 1) {
                    setTimeout(function(){tagSelector.dispatchEvent(new Event("change")); }, 2000);
                } else {
                    tagSelector.dispatchEvent(new Event("change"));
                }
            }
        }
    };

    //fire hide/show logic again if history/url changes.
    var pushState = history.pushState;
    history.pushState = function () {
        pushState.apply(history, arguments);
        simulateSelectBoxEvent();
    };

    //on click of watchlist tab (1-5)
    jQ(document).on('click', allDOMPaths.domPathTabToChangeWatchlist,simulateSelectBoxEvent);

    //logic to scroll relevant stock in holding and highlight it
    jQ(document).on('click', allDOMPaths.domPathWatchlistRow, function () {
        var watchlistStock = jQ(this).find(allDOMPaths.domPathStockNameInWatchlistRow).html();
        debug("clicked on : " + watchlistStock);

        var holdingTRs = jQ(allDOMPaths.rowsFromHoldingsTable);

        jQ.expr[':'].regex = function(elem, index, match) {
            var matchParams = match[3].split(','),
                validLabels = /^(data|css):/,
                attr = {
                    method: matchParams[0].match(validLabels) ?
                    matchParams[0].split(':')[0] : 'attr',
                    property: matchParams.shift().replace(validLabels,'')
                },
                regexFlags = 'ig',
                regex = new RegExp(matchParams.join('').replace(/^\s+|\s+jQ/g,''), regexFlags);
            return regex.test(jQ(elem)[attr.method](attr.property));
        }

        //tigadam for stocks with & in name
        if (watchlistStock.indexOf('&') >= 0) {
            watchlistStock = watchlistStock.slice(0,watchlistStock.indexOf('&amp;'))+'&'+watchlistStock.slice(watchlistStock.indexOf('&amp;')+5,watchlistStock.length);
        }
        var holdingStockTR = jQ("tr:regex("+allDOMPaths.attrNameForInstrumentTR+", ^"+watchlistStock+".*)");

        if (holdingStockTR.length > 0) {
            debug("found holding row for scrolling : " + holdingStockTR);
            var w = jQ(window);
            w.scrollTop( holdingStockTR.offset().top - (w.height()/2) );
            jQ(holdingStockTR).css("background-color", 'lightGray');
            setTimeout(function(){ jQ(holdingStockTR).css("background-color", 'white'); }, 4000);
        }
    });

}

addJQuery(main);
