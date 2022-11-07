///////////////////////////////////////
///  ZNET Emissions Bubble Viewer   ///
///                                 ///
///  Adapated from                       
///////////////////////////////////////

var masterData, dataCO2, dataCO2stack = [],
    emissionSectorNames = [], economicSectorNames = [], sourceSectorNames =[], znetBoundaryNames = [], emissionsTypeNames = [],
    emissionSectorData = [],  economicSectorData = [],
    sourceData = [], 
    endUserData = [], 
    activityData = []
var dataBaselinePosCO2, dataBaselineNegCO2, grossEmissions, netEmissions, creditEmissions,
    dataZNETPosCO2, dataZNETNegCO2, grossZNETEmissions, netZNETEmissions, creditZNETEmissions;
var dataPosEnergy, dataNegEnergy, grossEnergy, netEnergy, creditEnergy,
    dataZNETPosEnergy, dataZNETNegEnergy, grossZNETEnergy, netZNETEnergy, creditZNETEnergy;

var formatComma = d3.format(",")

// Initialisation function to pull data from google sheet
    window.addEventListener('DOMContentLoaded', init)

    function init(){    
        // Create Promise for loading data
        let loadData = new Promise( (resolve, reject) => {
            let dataReceivedSuccessfully = false; 
            if (dataReceivedSuccessfully) 
                resolve('Google Sheet available'); 
            if (!dataReceivedSuccessfully) 
                reject('Google Sheet not available. Using static files'); 
        }) 
        // Define actions for promise to get data from Google Sheet if possible, or if error, load from TSV
        loadData.then( (message) => {             
            renderFromGS();     console.log(message); 
        }).catch( (message) => {
            renderFromTSV();    console.log(message);
        })
    }; // end init()

    function renderFromGS(){
        var public_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1KCqyjJUcbm33QY_E-KDz4uTmrauiP6JId1Ed8ErUL5w/";
        Tabletop.init({ 
            key: public_spreadsheet_url,
            callback: renderVis,
            simpleSheet: true,
            wanted: ['data'] 
        });
    } // end renderFromGS()
    
    function renderFromTSV(){
      d3.tsv("data/data.txt").then(function(data){ 
        renderVis(data)
      });                 
    } // end renderFromTSV

    function renderVis(data){
        parseData(data);
        renderBubbleChart(masterData, 'emissions')
        renderBarChart(dataCO2stack, 2000)
    } // end renderVis()

// Parse data
    function parseData(data){
        // Parse numbers from text
        data.forEach(function(d) {
            d.emissionsBaseline = +d.bau2018;
            d.energy = +d.bauEnergy2018;
            d.emissionsAbatement = +d.emissionsAbatement;
            d.natural = +d.natural;
            if(d.emissionsAbatement > 0){
                d.emissionsBaselineType  = 'Credits'} else {
                d.emissionsBaselineType  = 'Emissions'} 
          })

        // Use emissios data and  a variable for "size" 
        masterData = data.filter(function(d) { return d.boundary === "Included" })
     
        // Create 'positive' and 'negartive' (i.e. renewables/offsets datasets)
        dataBaselinePosCO2 = masterData.filter(function(d) { return d.boundary === "Included"  &&  d.emissionsBaseline > 0 })
        dataBaselineNegCO2 = masterData.filter(function(d) { return d.boundary === "Included"  &&  d.emissionsBaseline < 0  })

        // Calculate emisisons, and energy totals
        grossEmissions = d3.sum(dataBaselinePosCO2, function(d) { return d.emissionsBaseline; });
        creditEmissions = d3.sum(dataBaselineNegCO2, function(d) { return d.emissionsBaseline; });    
        netEmissions = grossEmissions + creditEmissions;

        grossEnergy = d3.sum(dataBaselinePosCO2, function(d) { return d.energy; });
        offsetEnergy = d3.sum(dataBaselineNegCO2, function(d) { return d.energy; });    
        netEnergy = grossEnergy + creditEnergy;

        // Create 'positive' and 'negarive' (i.e. renewables/offsets datasets) for ZNET boundary
        dataZNETPosCO2 = masterData.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline > 0 })
        dataZNETNegCO2 = masterData.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline < 0  })

        grossZNETEmissions = d3.sum(dataZNETPosCO2, function(d) { return d.emissionsBaseline; });
        creditZNETEmissions = d3.sum(dataZNETNegCO2, function(d) { return d.emissionsBaseline; });    
        netZNETEmissions = grossZNETEmissions + creditZNETEmissions;

       // Calculate emisisons, and energy totals for ZNET boundary
        grossZNETEnergy = d3.sum(dataZNETPosCO2, function(d) { return d.energy; });
        offsetZNETEnergy = d3.sum(dataZNETNegCO2, function(d) { return d.energy; });    
        netZNETEnergy = grossZNETEnergy + creditZNETEnergy;


        // Create lists of unique names for groupings
        getUniqueNames(data, 'emissionsSector', emissionSectorNames)
        getUniqueNames(data, 'economicSector', economicSectorNames)
        getUniqueNames(data, 'source', sourceSectorNames)
        getUniqueNames(data, 'boundary', znetBoundaryNames)
        getUniqueNames(data, 'emissionsBaselineType', emissionsTypeNames)

        function getUniqueNames(data, unit, outputArray){
            var tmp = [];
            for(i = 0; i < data.length; i++) {
                if(tmp[data[i][unit]]) continue;
                tmp[data[i][unit]] = true;
                outputArray.push(data[i][unit]);
            }
        } //  end getNames()

        var stackEmissionSectorGrossObj = {
                "type" : "emissionsSectorGross",
                "total" : netZNETEmissions
            },
            stackEmissionSectorCreditObj = {
                "type" : "emissionsSectorCredit",
                "total" : netZNETEmissions
            };

        
        for( i = 0; i < emissionSectorNames.length ; i++){
            // Create emissionSectorData
            var obj = {};
            obj = {
                "name": emissionSectorNames[i],
                "emissionsGross": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline > 0  && d.emissionsSector === emissionSectorNames[i] }), function(d) {return d.emissionsBaseline} ),
                "emissionsCredit": Math.abs(d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline < 0  && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.emissionsBaseline}) ),
                "netEmissions": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.emissionsBaseline} ),
                "energyCredit": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline < 0  && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.energy} ),
                "energyGross": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.energy} ),
                "netEnergy": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline > 0  && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.energy} ),
                "electricityGrid": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.source === 'Electricity' && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.natural} ),
                "electricityRenewable": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.source === 'Wind' || d.source === 'Solar'  && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.natural} ),
                "elecricityTotal": d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.source === 'Electricity' || d.source === 'Wind' || d.source === 'Solar' && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.natural} )
            }
            emissionSectorData.push(obj)
            stackEmissionSectorGrossObj = Object.assign(stackEmissionSectorGrossObj, {[emissionSectorNames[i]]: d3.sum(data.filter(function(d) { return d.boundary === "Included" && d.emissionsBaseline > 0  && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.emissionsBaseline} )})
            stackEmissionSectorCreditObj = Object.assign(stackEmissionSectorCreditObj, {[emissionSectorNames[i]]: Math.abs(d3.sum(data.filter(function(d) { return d.emissionsBaseline < 0  && d.emissionsSector === emissionSectorNames[i]; }), function(d) {return d.emissionsBaseline}), function(d) {return d.emissionsBaseline} )})
        }

        dataCO2stack.push(stackEmissionSectorGrossObj)
        dataCO2stack.push(stackEmissionSectorCreditObj)
    }; //endParseData()

let forces, updateForces;


// Bubble chart function
function renderBubbleChart(chartData, unit) {

    // Filter data and setup variables
    chartData = chartData.filter(function(d) { return d.emissionsBaseline !== 0  ; }) // Filter to positive emissins and credits
    chartData.forEach(function(d) { d.emissionsBaseline = Math.abs(d.emissionsBaseline); })

    var creditData = chartData.filter(function(d) { return d.emissionsAbatement > 0  ; })
console.log(chartData)
    var emissionsArray = chartData.map(function(d) { return +d[unit]; });
console.log(emissionsArray)
    var meanEmissions = d3.mean(emissionsArray),
        emissionsExtent = d3.extent(emissionsArray),
        emissionsMax  = d3.max(emissionsArray),
        emissionsArraycaleX,
        emissionsArraycaleY;

    var colours01 = ["#F2055C", "#FFB525", "#98D200", "#2FAAFF", "#0C8B8C"];

    // '#F2055C', '#340040', '#07F2F2', '#05F26C', '#EAF205', '#FFB525', '#FFB525', '#98D200', '#2FAAFF', '#FFF3CC'
    var sectors = d3.set(chartData.map(function(d) { return d.emissionsSector; }));

    var sectorColorScale = d3.scaleOrdinal()
        .range(colours01)
        .domain(sectors.values());

    var width = 1200,
        height = 800;
    var svg, labelGroup,
        circles,
        circleSize = { min: 10, max: 80 },
        creditCircleSize = 10,
        circlePadding = 2,
        circleForce = -10
    var circleRadiusScale = d3.scaleSqrt()
        .domain(emissionsExtent)
        .range([circleSize.min, circleSize.max]);

    var forceSimulation;
    var forceStrength = 0.10;

    // 
    createSVG();
    toggleKey(true) 
    createCircles(chartData);
    createForces();
    createForceSimulation(chartData);
    addGroupingListeners();

    function createSVG() {
        svg = d3.select("#bubbleChart")
        var config = { radius: 5 };

        var defs = svg.append('defs')
        var filter = defs.append('filter').attr('id','gooey');
        filter.append('feGaussianBlur')
            .attr('in','SourceGraphic')
            .attr('stdDeviation', config.radius * 1.8)
            .attr('result','blur');
        filter.append('feColorMatrix')
            .attr("class", "blurValues")
            .attr('in','blur')
            .attr('mode','matrix')
            .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ' + config.radius +' -6')
            .attr('result','gooey');
        filter.append("feBlend")
            .attr("in", "SourceGraphic")
            .attr("in2", "gooey")
            .attr("operator", "atop");
    }// end createSVG(

    function toggleKey(showKey) {
        var keyElementWidth = 150,
            keyElementHeight = 30;
        var onScreenYOffset = keyElementHeight,
            offScreenYOffset = 100;

        if (d3.select(".sector-key").empty()) {
          createKey();
        }
        var key = d3.select(".sector-key");

        if (showKey) {
          translateKey("translate(0," + (height - onScreenYOffset) + ")");
        } else {
          translateKey("translate(0," + (height + offScreenYOffset) + ")");
        }

        function createKey() {
            var keyWidth = keyElementWidth * sectors.values().length;
            var KeyScale = d3.scaleBand()
                .domain(sectors.values())
                .range([(width - keyWidth) / 2, (width + keyWidth) / 2]);

            svg.append("g")
                .attr("class", "sector-key")
                .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
                .selectAll("g")
                .data(sectors.values())
                .enter().append("g")
                    .attr("class", "sector-key-element");

            d3.selectAll("g.sector-key-element")
                .append("rect")
                    .attr("width", keyElementWidth)
                    .attr("height", keyElementHeight)
                    .attr("x", function(d) { return KeyScale(d); })
                    .attr("fill", function(d) { return sectorColorScale(d); });

            d3.selectAll("g.sector-key-element")
                .append("text")
                    .attr("text-anchor", "middle")
                    .attr("x", function(d) { return KeyScale(d) + keyElementWidth/2; })
                    .text(function(d) { return d; })

            // The text BBox has non-zero values only after rendering
            d3.selectAll("g.sector-key-element text")
                .attr("y", function(d) {
                    var textHeight = this.getBBox().height;
                    // The BBox.height property includes some extra height we need to remove
                    var unneededTextHeight = 4;
                    return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
                });

        } // createKey()

        function translateKey(translation) {
          key.transition()
            .duration(500)
            .attr("transform", translation);
        } // end tranalateKey(
    } // end toggleKey()

    function isChecked(elementID) {
        return d3.select(elementID).property("checked");
    } // isChecked()

    function createCircles(data) {
        var circlesGroup = svg.append("g").attr("id", "circlesGroup")
          // .style("filter", "url(#gooey)");
        labelGroup = svg.append("g").attr("id", "labelGroup")

        var formatEmissionNumber = d3.format(",");
        var formatEnergyNumber = d3.format(",");

        circles = circlesGroup.selectAll("circle")
          .data(data)
          .enter()
            .append("circle")
            .attr("r", function(d) {  
                if(d.emissionsAbatement > 0 ){ 

                    return Math.sqrt(d.emissionsAbatement /emissionsMax) * circleSize.max ; 
                } else { 
                    return Math.sqrt(d[unit] /emissionsMax) * circleSize.max 
                }
            })
            .attr("fill", function(d) { 
                if(d.emissionsAbatement > 0 ){                 
                    return 'none'
                } else { 
                    return sectorColorScale(d.emissionsSector); 
                }
            })
            .attr("stroke", function(d) { 
                if(d.emissionsAbatement > 0 ){                 
                    return sectorColorScale(d.emissionsSector); 
                } else { 
                    return null
                }
            })
            .attr("class",  function(d){ if(d.emissionsAbatement > 0 ){ return "credit";  }   })
            .on("mouseover", function(d) { updateInfo(d); })
            .on("mouseout", function(d) { updateInfo(); })
            .call(d3.drag()
                .on("start",dragstarted)
                .on("drag",dragged)
                .on("end",dragended))           


        function updateInfo(element) {
          var info = "";
          if (element) {
            info = element.endUser+' | '+element.economicSector+' | '+element.activity +" | "+element.source+" | " +formatEmissionNumber(element[unit]) +" t CO2-e";
          }
          d3.select("#info").html(info);
        }

        // Node drag behaviour
         function dragstarted(d){ 
            forceSimulation.restart();
            forceSimulation.alpha(0.8);
            d.fx = d.x;
            d.fy = d.y;
         }; // end dragstarted()

         function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
         };  // end dragged()

         function dragended(d) {
            d.fx = null;
            d.fy = null;
            forceSimulation.alphaTarget(forceStrength);
         };   // end draggended()
    }; // end createCircles();

    function createForces() {
        forces = {
            combine:            createCombineForces(),
            emissionsSectors:   createEmissionSectorForces(),
            economicSectors:    createEconomicSectorForces(),
            distribution:       createDistributionForces(),
            znetBoundary:       createZNETForces(),
            netEmissions:       createNetEmissionsForces(),
        };
    
        // Set of functions to control the focii
        function createCombineForces() {                    
          return {
            x: d3.forceX(width / 2).strength(forceStrength),
            y: d3.forceY(height / 2).strength(forceStrength)
          };
        }; // end createCombineForeces

        function createEmissionSectorForces() {            
            // Create labels                  
            labelGroup.selectAll(".sectorLabel.emissionsSector")
                .data(emissionSectorNames).enter()
                    .append("text")
                .classed('sectorLabel emissionsSector', true)
                    .text(function(d){return d})            
                .attr("x", function(d){ 
                        var tmp = {};
                        tmp.emissionsSector = d  ; 
                        return sectorForceX(tmp); 
                    })
                .attr("y", function(d){ 
                        var tmp = {};
                        tmp.emissionsSector  = d  ; 
                        return sectorForceY(tmp); 
                    })
            // Return forces
            return {
                x: d3.forceX(sectorForceX).strength(forceStrength),
                y: d3.forceY(sectorForceY).strength(forceStrength)
            };

                function sectorForceX(d) {
                    if (d.emissionsSector === emissionSectorNames[0]) {
                      return left(width);
                    } else if (d.emissionsSector === emissionSectorNames[1]) {
                      return left(width);
                    } else if (d.emissionsSector === emissionSectorNames[2]) {
                      return right(width);
                    } else if (d.emissionsSector === emissionSectorNames[3]) {
                      return right(width);
                    } else if (d.emissionsSector === emissionSectorNames[4]) {
                      return center(width);                    
                    }
                } // end sectorForceX()

                function sectorForceY(d) {
                    if (d.emissionsSector ===  emissionSectorNames[0]) {
                      return top(height);
                    } else if (d.emissionsSector === emissionSectorNames[1]) {
                      return bottom(height);
                    } else if (d.emissionsSector === emissionSectorNames[2]) {
                      return top(height);
                    } else if (d.emissionsSector === emissionSectorNames[3]) {
                      return bottom(height);
                    } else if (d.emissionsSector === emissionSectorNames[4]) {
                        return center(height);                    
                    }
                }; // end sectorForceY()

                function left(dimension) { return dimension / 4; }
                function center(dimension) { return dimension / 2; }
                function right(dimension) { return dimension / 4 * 3; }
                function top(dimension) { return dimension / 4; }
                function bottom(dimension) { return dimension / 4 * 3; }
        } // end createEmissionSectorForces()

        function createEconomicSectorForces() {
            // Create labels            
            labelGroup.selectAll(".sectorLabel.economicSector")
                .data(economicSectorNames).enter()
                    .append("text")
                .classed('sectorLabel economicSector', true)
                    .text(function(d){return d})            
                .attr("x", function(d){ 
                        var tmp = {};
                        tmp.economicSector = d  ; 
                        return sectorForceX(tmp); 
                    })
                .attr("y", function(d){ 
                        var tmp = {};
                        tmp.economicSector  = d  ; 
                        return sectorForceY(tmp); 
                    })

            // Return forces
            return {
                x: d3.forceX(sectorForceX).strength(forceStrength),
                y: d3.forceY(sectorForceY).strength(forceStrength)
            };

                function sectorForceX(d) {
                    if (d.economicSector === economicSectorNames[0]) {  // Residential
                      return left(width);
                    } else if (d.economicSector === economicSectorNames[5]) { // Land sector
                      return left(width);
                    } else if (d.economicSector === economicSectorNames[4]) { // Municipal
                      return left(width);
                    } else if (d.economicSector === economicSectorNames[3]) { // Farming
                      return center(width);
                    } else if (d.economicSector === economicSectorNames[1]) { // Commerical 
                      return right(width);                    
                    } else if (d.economicSector === economicSectorNames[2]) { // Industrial
                      return right(width);                    
                    }
                } // end sectorForceX()

                function sectorForceY(d) {
                    if (d.economicSector === economicSectorNames[0]) {
                      return top(height);
                    } else if (d.economicSector === economicSectorNames[5]){
                      return bottom(height);
                    } else if (d.economicSector === economicSectorNames[4]) {
                      return bottom(height);
                    } else if (d.economicSector === economicSectorNames[3]) {
                      return center(height);
                    } else if (d.economicSector === economicSectorNames[1]) {
                      return top(height);                    
                    } else if (d.economicSector ===  economicSectorNames[2]) {
                      return bottom(height);                    
                    }
                }; // end sectorForceY()

                function left(dimension) { return dimension * 0.2   ; }
                function center(dimension) { return dimension * 0.5; }
                function right(dimension) { return dimension  *0.8; }
                function top(dimension) { return dimension *0.3 ; }
                function bottom(dimension) { return dimension *0.7; }
        } // end createEmissionSectorForces()

        function createZNETForces() {
            // Create labels
            labelGroup.selectAll(".sectorLabel.znetBoundary")
                .data(znetBoundaryNames).enter()
                    .append("text")
                .classed('sectorLabel znetBoundary', true)
                    .text(function(d){return d})            
                .attr("x", function(d){ 
                        var tmp = {};
                        tmp.boundary = d  ; 
                        return sectorForceX(tmp); 
                    })
                .attr("y", function(d){ 
                        var tmp = {};
                        tmp.boundary  = d  ; 
                        return sectorForceY(tmp); 
                    })

            // Return forces
            return {
                x: d3.forceX(sectorForceX).strength(forceStrength),
                y: d3.forceY(sectorForceY).strength(forceStrength)
            };

                function sectorForceX(d) {
                    if (d.boundary === znetBoundaryNames[0]) {
                      return left(width);
                    } else if (d.boundary === znetBoundaryNames[1]) {
                      return right(width);
                    } 
                } // end sectorForceX()

                function sectorForceY(d) {
                    if (d.boundary === znetBoundaryNames[0]) {
                      return center(height);
                    } else if (d.boundary === znetBoundaryNames[1]) {
                      return center(height);
                    } 
                }; // end sectorForceY()

                function left(dimension) { return dimension / 4; }
                function center(dimension) { return dimension / 2; }
                function right(dimension) { return dimension / 4 * 3; }
                function top(dimension) { return dimension / 4; }
                function bottom(dimension) { return dimension / 4 * 3; }
        } // end createZNETForces()

        function createNetEmissionsForces() {
            // Create labels
            labelGroup.selectAll(".sectorLabel.netEmissions")
                .data(emissionsTypeNames).enter()
                    .append("text")
                .classed('sectorLabel netEmissions', true)
                    .text(function(d){return d})            
                .attr("x", function(d){ 
                        var tmp = {};
                        tmp.emissionsType = d  ; 
                        return sectorForceX(tmp); 
                    })
                .attr("y", function(d){ 
                        var tmp = {};
                        tmp.emissionsType  = d  ; 
                        return sectorForceY(tmp); 
                    })
            // Return forces

            return {
                x: d3.forceX(sectorForceX).strength(forceStrength),
                y: d3.forceY(sectorForceY).strength(forceStrength)
            };

                function sectorForceX(d) {
                    if (d.emissionsBaselineType === emissionsTypeNames[0]) {
                      return left(width);
                    } else if (d.emissionsBaselineType === emissionsTypeNames[1]) {
                      return right(width);
                    } 
                } // end sectorForceX()

                function sectorForceY(d) {
                    if (d.emissionsBaselineType === emissionsTypeNames[0]) {
                      return center(height);
                    } else if (d.emissionsBaselineType === emissionsTypeNames[1]) {
                      return center(height);
                    } 
                }; // end sectorForceY()

                function left(dimension) { return dimension / 4; }
                function center(dimension) { return dimension / 2; }
                function right(dimension) { return dimension / 4 * 3; }
                function top(dimension) { return dimension / 4; }
                function bottom(dimension) { return dimension / 4 * 3; }
        } // end createNetEmissionsForces()

        // Function to create forces for layout
        function createDistributionForces() {       
            var scaledEmissionMargin = circleSize.max;

            emissionsArrayScaleX = d3.scaleBand()
                .domain(emissionSectorNames)
                .range([scaledEmissionMargin, width - scaledEmissionMargin*2]);
            emissionsArrayScaleY = d3.scaleLinear()
                .domain(emissionsExtent)
                .range([height - scaledEmissionMargin, scaledEmissionMargin*2]);

            var centerCirclesInScaleBandOffset = emissionsArrayScaleX.bandwidth() / 2;
            
            return {
                x: d3.forceX(function(d) {
                        return emissionsArrayScaleX(d.emissionsSector) + centerCirclesInScaleBandOffset;
                    }).strength(forceStrength),
                y: d3.forceY(function(d) {
                        return emissionsArrayScaleY(d.emissionsBaseline);
                    }).strength(forceStrength)
            };
        } // createDistributionForces()

        function createGeoForces() {
          var projectionStretchY = 0.25,
              projectionMargin = circleSize.max,
              projection = d3.geoEquirectangular()
                .scale((width / 2 - projectionMargin) / Math.PI)
                .translate([width / 2, height * (1 - projectionStretchY) / 2]);

          return {
            x:  d3.forceX(function(d) {
                    return projection([d.centerLongitude, d.centerLatitude])[0];
                }).strength(forceStrength),
            y:  d3.forceY(function(d) {
                    return projection([d.centerLongitude, d.centerLatitude])[1] * (1 + projectionStretchY);
                }).strength(forceStrength)
          };
        } // end createSectorForces()
    } // createForces()

    function createForceSimulation(data) {
        forceSimulation = d3.forceSimulation()
          .force("x", forces.combine.x)
          .force("y", forces.combine.y) 
          .force('charge', d3.forceManyBody().strength(circleForce))          
          .force("collide", d3.forceCollide(forceCollide));

        forceSimulation.nodes(data)
          .on("tick", function() {
            circles
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
          });
    } // end createForceSimluation()

    function forceCollide(d) {
        // return geoCenterGrouping() || distributionGrouping() ? 0 : circleRadiusScale(d.emissionsBaseline) + 1;
        if(geoCenterGrouping() || distributionGrouping()){ 
            return 0
        } else { 
            return Math.sqrt(Math.abs(d[unit]) / emissionsMax) * circleSize.max + circlePadding
        }
    } // end createForceSimluation()

    function geoCenterGrouping() {
        // return isChecked("#geoCentres");
    } // end countryCenterGrouping()


    function distributionGrouping() {
        return isChecked("#distribution");
    } // end distributionGrouping()

    function addGroupingListeners() {
        addListener("#combine",             forces.combine);
        addListener("#emissionSectors",     forces.emissionsSectors);
        addListener("#economicSectors",     forces.economicSectors);
        addListener("#znetBoundary",        forces.znetBoundary);
        addListener("#distribution",        forces.distribution);
        addListener("#netEmissions",        forces.netEmissions);

        function addListener(selector, forces) {
            d3.select(selector).on("click", function() {
                // Sort out the labels
                d3.selectAll('.sectorLabel').style('visibility', 'hidden')
                d3.selectAll('circle:not(.credit)')
                    .style('stroke', null)
                    .style('stroke-width', null)

                toggleAxis(distributionGrouping());
                toggleKey(!distributionGrouping())

                if(isChecked("#economicSectors")){
                    d3.selectAll('.sectorLabel.economicSector').style('visibility', 'visible')
                } else if(isChecked("#znetBoundary")){
                    d3.selectAll('.sectorLabel.znetBoundary').style('visibility', 'visible')
                } else if(isChecked("#emissionSectors")){
                    d3.selectAll('.sectorLabel.emissionsSector').style('visibility', 'visible')
                    toggleKey(false)
                } else if(isChecked("#netEmissions")){
                    d3.selectAll('.sectorLabel.netEmissions').style('visibility', 'visible')
                } else if(isChecked("#distribution")){
                    d3.selectAll('circle:not(.credit)')
                        .style('stroke', '#fff')
                        .style('stroke-width', '1.5px')
                }

                updateForces(forces); 
            })
        } // end addListener()


        updateForces = function(forces) {
            console.log(forces)
            forceSimulation
                .force("x", forces.x)
                .force("y", forces.y)
                .force("collide", d3.forceCollide(forceCollide))
                .alphaTarget(forceStrength)
                .restart();
            //  Disable repulsive force for distribution chart
            if(geoCenterGrouping() || distributionGrouping()){ 
                forceSimulation.force('charge', null)
            } else { 
                forceSimulation.force('charge', d3.forceManyBody().strength(circleForce))
            }
        } // end updateForces()

        function toggleAxis(showAxes) {
            var onScreenXOffset = 40,
                offScreenXOffset = -300;
            var onScreenYOffset = 40,
                offScreenYOffset = 100;

            if (d3.select(".x-axis").empty()) { createAxes(); }
            var xAxis = d3.select(".x-axis"),
                yAxis = d3.select(".y-axis");

            if (showAxes) {
                translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
                translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
            } else {
                translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
                translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
            }

            function createAxes() {
                var numberOfTicks = 10,
                    tickFormat = ".0s";

                var xAxis = d3.axisBottom(emissionsArrayScaleX)
                    .ticks(numberOfTicks, tickFormat);

                svg.append("g")
                  .attr("class", "x-axis")
                  .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
                  .call(xAxis)
                  .selectAll(".tick text")
                    .attr("font-size", "1.5rem");
               
                var yAxis = d3.axisLeft(emissionsArrayScaleY)
                    .ticks(numberOfTicks, tickFormat);

                svg.append("g")
                  .attr("class", "y-axis")
                  .attr("transform", "translate(" + offScreenXOffset + ",0)")
                  .call(yAxis);
            } // createAxes() 

            function translateAxis(axis, translation) {
                axis.transition().duration(500)
                    .attr("transform", translation);
            } // translateAxis()
        }// end toggleAxis()
    }  // addGroupingListeners()
} // renderBubbleChart()


// Bar chart function
let renderNetBars;
function renderBarChart(data, duration){

    let barChart = d3.select('#barChart'),
        margin = {top: 200, right: 100, bottom: 100, left: 200},
        width = 1200- margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        g = barChart.append("g")
            .attr('id', 'barChart')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var coloursEmissionSectors = ["#F2055C", "#FFB525", "#98D200", "#2FAAFF", "#0C8B8C"];

    let sectorColorScale = d3.scaleOrdinal()
        .range(coloursEmissionSectors)
        .domain(emissionSectorNames.values());

    let y = d3.scaleBand()         
        .rangeRound([0, height])   
        .paddingInner(0.05)
        .align(0.1);

    let x = d3.scaleLinear()       
        .rangeRound([0, width]);   

    let keys = emissionSectorNames,
        chartData = d3.stack().keys(keys)(data)

    y.domain(data.map(function(d) { return d.type; }));                  
    x.domain([0, d3.max(data, function(d) { return d.total; })]).nice();  
    sectorColorScale.domain(keys);


    // Setup titles
    let barText = barChart.append('g').attr('id', 'barText')   

    let mainBarTitle = barText.append("text").classed('barMainTitle', true)
          .attr("y", margin.top*0.75)                                           
          .attr("x", (width + margin.left + margin.right)/2)                                                          
          .attr("text-anchor", "middle")
          .text("Baseline emissions in Hepburn Shire")

     let subBarTitle = barText.append("text").classed('barSubTitle', true)
          .attr("y", margin.top*0.85)                                           
          .attr("x", (width + margin.left + margin.right)/2)                                                     
          .attr("text-anchor", "middle")


    let barAnnotation =  barText.append("g").attr('id', 'barAnnotationGroup')
    let barLabels =  barText.append("g").attr('id', 'barLabels')

    // Annotation
    renderBarAnnotation()
        function renderBarAnnotation(){

            barAnnotation.append("text").classed('barAnnotation', true)
                .attr("y", margin.top*0.9)                                           
                .attr("x", margin.left+ x(grossZNETEmissions/2) )                                                     
                .attr("text-anchor", "middle")
                .text(formatComma(Math.round(grossZNETEmissions/100, 0)*100)+" tonnes of carbon emissions (tCO2-e) in 2018 before carbon 'sinks'")

            barAnnotation.append("text").classed('barAnnotation land', true)
                .attr("y", margin.top + height)                                           
                .attr("dy", -5.75)                                           
                .attr("x", margin.left - x(-creditZNETEmissions/2) )                                                     
                .attr("text-anchor", "middle")
                .text(formatComma(Math.round(creditZNETEmissions/100, 0)*100)+" tonnes of carbon absorbed in forestry 'sinks'")
                .call(wrap, 80, 1)
        }// end renderBarAnnotation()



    // Render bars
    renderGrossBars(chartData, 1200)
    addBarLabels(emissionSectorData)

    // Render gross bar chart
    function renderGrossBars(data, duration){
        // Add bars
        g.append("g").selectAll(".barEmissions")
            .data(data)
            .enter().append("g")
                .attr('class', "barEmissions")              
                .attr("fill", function(d){ return sectorColorScale(d.key);})
                .attr("stroke", function(d){return sectorColorScale(d.key);})
                .attr("stroke-width", '2px')
            .selectAll("rect")
                .data(function(d) { return d; })
                .enter().append("rect")
                    .attr("class", function(d, i){return d.data.type })
                    .attr("fill", function(d){ 
                        if (d.data.type === "emissionsSectorCredit") { return 'none' }
                        return null;
                    })
                    .attr("stroke", function(d){ 
                        if (d.data.type !== "emissionsSectorCredit") { return '#fff' }
                        return null;
                    })
                    .attr("x", function(d) { 
                        if (d.data.type === "emissionsSectorCredit") { return -(x(d[1]) - x(d[0])) }
                        return x(d[0]); 
                    })         
                    .attr("y", function(d) {return y(d.data.type); })     
                    .attr("height", y.bandwidth() )
                    .attr("width", 0)
                .transition().ease(d3.easeLinear)
                    .duration(function(d){ return ((d[1] - d[0])/ d.data.total) * duration })
                    .delay(function(d){ return (d[0])/ d.data.total * duration })
                        .attr("width", function(d) {return x(d[1]) - x(d[0]); })    

        // Add axis
        g.append("g").attr('id', 'barYaxis')
            .attr("class", "axis")
            .attr("transform", "translate(0,0)")     
            .call(d3.axisLeft(y));                

        g.append("g").attr('id', 'barXaxis')
            .attr("class", "axis")
            .attr("transform", "translate(0,"+height+")")             
            .call(d3.axisBottom(x).ticks(5, "s"))                

        // Add a legend
        // var legend = g.append("g")
        //     .attr('id', 'legend')
        //     .attr("text-anchor", "end")
        //     .selectAll("g")
        //     .data(keys.slice().reverse())
        //     .enter().append("g")
        //     .attr("transform", function(d, i) { return "translate(-50," + (300 + i * 20) + ")"; });

        // legend.append("rect")
        //     .attr("x", width - 19)
        //     .attr("width", 19)
        //     .attr("height", 19)
        //     .attr("fill", sectorColorScale);

        // legend.append("text")
        //     .attr("x", width - 24)
        //     .attr("y", 9.5)
        //     .attr("dy", "0.32em")
        //     .text(function(d) { return d; });
    }// end rendeNetBars()


    // Manually add bar labels   
    function addBarLabels(data){
        let cumulative = 0,
            emissionsCenter = 0;

        for (i = 0; i < data.length; i++ ){
            cumulative = data[i]['emissionsGross'] + cumulative
            emissionsCenter = cumulative - data[i]['emissionsGross']/2

            barLabels.append('text').attr('class', 'barLabel')
                    .attr('x', function(){ return margin.left + x(emissionsCenter) })
                    .attr('y', margin.top + 45)
                    .attr("text-anchor", "middle")
                    .text(function(){  return data[i]['name'] })

            barLabels.append('text').attr('class', 'barLabelValue')
                    .attr('x', function(){ return margin.left + x(emissionsCenter) })
                    .attr('y', margin.top + 64)
                    .attr("text-anchor", "middle")
                    .text(function(){  return formatComma(Math.round(data[i]['emissionsGross']/100,0)*100) })
        
            barLabels.append('text').attr('class', 'barLabelUnit')
                    .attr('x', function(){ return margin.left + x(emissionsCenter) })
                    .attr('y', margin.top + 77)
                    .attr("text-anchor", "middle")
                    .text('t CO2-e')


        }            
    } // addBarLabels()

    function updateBars(data, duration){
        d3.selectAll('.barEmissions')
            .data(data)
            .selectAll('rect')
            .data(function(d) { return d; })            
            .transition().duration(duration)            
                .attr("x", function(d) { 
                    if (d['data']['type'] === "emissionsSectorCredit") { return -(x(d[1]) - x(d[0])) }
                    return x(d[0]); 
                })         
                .attr("width", function(d) {return x(d[1]) - x(d[0]); })    
                .attr("fill", function(d){ 
                    if (d.data.type === "emissionsSectorCredit") { return 'none' }
                    return null;
                })
    } // end updateBars()


    renderNetBars = function(duration){
        mainBarTitle.text("Baseline emissions in Hepburn Shire")
        // subBarTitle.text('An estimated '+formatComma(Math.round(netZNETEmissions/100, 0)*100)+" tonnes of carbon dioxide (CO2-e)")

        // Fade existing bar annotation
        d3.selectAll('.barAnnotation')
            .transition().duration(800)
            .style('opacity', 0)

        barLabels.transition().duration(800)
                    .style('opacity', 0)

        // Move credit bar up
        d3.selectAll(".emissionsSectorCredit")
            .transition().duration(duration)
                .attr("y", y.bandwidth()/2)      
        // Move gross bars down
        d3.selectAll(".emissionsSectorGross")
            .transition().duration(duration)
                .attr("y", y.bandwidth()/2)
 
        // Update bar sizes
            chartData[4][1][1] = dataCO2stack[1]['Land use'] - dataCO2stack[0]['Land use']         // Update the credit data to net
            chartData[4][0][1] = chartData[4][0][0]         // Update the gross data to zero

        setTimeout(function(){
            updateBars(chartData, duration);
            d3.select('#legend').transition().duration(duration).style('opacity',0)

        }, duration)


        // Tranistion to Net emissions
        setTimeout(function(){
            d3.selectAll('.barEmissions')  
                .transition().duration(duration)                   
                    // .attr("width", function(d) {return x(d[1]) - x(d[0]); })    
                    .attr("fill", 'hsl(108,56%,48%)')
            d3.selectAll('.barEmissions>rect')   
                .transition().duration(duration)                                 
                    .attr("stroke", 'hsl(108,56%,48%)')

            setTimeout(function(){
                d3.selectAll('.barEmissions')
                    .transition().duration(duration)  
                    .attr('transform', 'translate(-'+x(chartData[4][1][1])+',0)')

            d3.selectAll(".emissionsSectorCredit")
                .transition().duration(duration)
                    .attr("width", 0)      
                    .attr("x", -x(0) )

            barAnnotation.append("text").classed('barLabel', true)      
                .attr("y", margin.top+height/2)     
                .attr("dy", "0.5rem")     
                .attr("x",  margin.left + x((grossZNETEmissions +creditZNETEmissions)/2))    
                .attr("text-anchor", "middle")
                .style('fill','#fff')                                 
                .style('font-size','2rem')
                .style('opacity',0)                              
                .text('Net Emissions of '+formatComma(Math.round((grossZNETEmissions+creditZNETEmissions)/100,0)*100)+' t CO2-e')
                .transition().duration(duration)
                    .style('opacity', 1)

            }, duration)
         
        }, duration*2)

    } // end addCreditBars(0)
}// end renderBarChart




///////////////////////
// HELPER FUNCTIONS  //
///////////////////////

    // Helper to wrap text labels
      function wrap(text, width, lineHeight) {
        text.each(function() {
          let text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              y = text.attr("y"),
              x = text.attr("x"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

          while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        })
      }; // end wrap() 

    // Function to turn strings in=to camelCase
      camelize = function camelize(str) {
        return str.replace(/\W+(.)/g, function(match, chr){ 
          return chr.toUpperCase();
        });
      } // end camelize()


