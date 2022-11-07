
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
              renderFromGS();       console.log(message); 
          }).catch( (message) => {
            renderFromTSV();      console.log(message);
          })
        }; // end init()

        function renderFromGS(){
          var public_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1KCqyjJUcbm33QY_E-KDz4uTmrauiP6JId1Ed8ErUL5w/";
          Tabletop.init({ 
              key: public_spreadsheet_url,
                  callback: renderVis,
                  simpleSheet: true,
                  wanted: ['macc'] 
            }
          );
        } // end renderFromGS()
        
        function renderFromTSV(){
          d3.tsv("data/macc.txt").then(function(data){ 
            renderVis(data)
          });                 
        } // end renderFromTSV

      // Render visualisation
      let masterData, 
          baselineEmissions, targetEmissions, cumAbatement,
          canvasWidth, canvasHeight, margin, height, width, tooltipDiv, 
          x, y, svg, xAxis, yAxis,
          blockIDs = [], blockClasses = [],
          optionTypeList = [], legendIDs = []

      var formatComma = d3.format(",")
      
      // Render vis on load
      function renderVis(data){
        parseData(data);                // Parse all text to numbers, create ID/class names, sort by least cost and create blockIDs array

        d3.select("#chart").remove()
        //Declare charting variables 
        margin = {top: 50, right: 50, bottom: 50, left: 90}
        canvasWidth = 960
        canvasHeight = 540
        width = canvasWidth - margin.left - margin.right
        height = canvasHeight - margin.top - margin.bottom

        // Set viewBox of existing SVG 
        d3.select('#vis').attr('viewBox', '0 0 '+canvasWidth+' '+canvasHeight)

        // Setup axis scales
        x = d3.scaleLinear().range([0, width]),
        y = d3.scaleLinear().range([height, 0]);
        xAxis = d3.axisBottom().scale(x).ticks(10),
        yAxis = d3.axisLeft().scale(y)
                .tickFormat(function (d) { 
                 if (d === 0) return ''; // No label for '0'
                 else if (d < 0) d = -d; // No nagative labels
                 return d ;})
              .ticks(10);
             
        // Append group for chart
        svg = d3.select("#vis").append("g")
          .attr('id', 'chart')
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
        // Apply transforma to scribble fills group
        d3.select("#scribbleFills")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          
        tooltipDiv = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);     // Define the div for the tooltip
        
        // Draw "Crisp MACC"
        drawMACC(data, 'levelisedCost', 2000);
      }; // end renderVis()


      // Re-render on selector change
      function reRender(){
        let selector = document.getElementById('macc-selector'),
            value = selector[selector.selectedIndex].value

          if(value === 'pencil'){
            sketchPencil(500, 'levelisedCost')
          } else if(value === 'scribble'){
            sketchScribble(500, 'levelisedCost')
          } else if(value === 'messy'){
            sketchMessy(500, 'levelisedCost')
          } else if (value === 'crisp'){
            renderVis(masterData)
          };          
      }; // end reRender()

      // Function to draw MACC curve 
      function drawMACC(d, levelisedCost, animationTime) {   
        // Set domains for axes from abatement and levelised cost data
        let totalAbatement = d3.sum(d, function (d) {return d.abatement} );             
        x.domain([0, targetEmissions] );
        y.domain(d3.extent(d, function (d) {return d[levelisedCost]}) );
          
        // Add blocks
        svg.selectAll(".block").data(d)
          .enter().append("rect")
          .attr("class", function(d){ 
            let string = d.class
              string = string.replace("(","")
              string =string.replace(")","")
              string = string.replace("/","")
              string = string.replace(".","")
              string = string.replace(":","")
              return string+" block" 
            })
          .attr("id", function(d){;
            let string =d.id;
              string = string.replace("(","")
              string =string.replace(")","")
              string = string.replace("/","")
              string = string.replace(".","")
              string = string.replace(":","")
              return string
            })
          .attr("x", function(d){ return x(d.abatementCumulative); })
          .attr("y", y(0))  // Start all on y = zero prior to transitioning
            .attr("width", function(d) { return x(d.abatement) })
            .attr("height", 0)
              .on("mouseover", function(d) {toolTipOn(d, d3.event.pageX, d3.event.pageY) })          
              .on("mouseout", toolTipOff)            
          .transition().ease(d3.easeLinear)
            .duration(function(d, i) { return animationTime / blockIDs.length; })
            .delay(function(d, i) { return  i * animationTime / blockIDs.length;  })
              .attr("y", function(d){ return d[levelisedCost] > 0 ? y(d[levelisedCost]) : y(0); })  // Offset positive blocks by height to position correctly on y-axis
              .attr("height", function(d) { return Math.abs(y(d[levelisedCost]) - y(0)); })                

        // Add x axis and label
        let xAxisGroup = svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0,"+ y(0) +")")
              .call(xAxis)
            xAxisGroup.append("text")
              .attr("class", "label")
              .attr("transform","translate("+ width +", 39)")
              .style("text-anchor", "end")
              .text("Emissions abatement")
            xAxisGroup.append("text")
              .attr("class", "subLabel")
              .attr("transform","translate("+ width +", 52)")
              .style("text-anchor", "end")
              .text("tonnes of carbon dioxide per annum");

        // Add y axis and label
        let yAxisGroup = svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            yAxisGroup.append("text")
              .attr("class", "label")
              .attr("transform", "rotate(-90)")
              .attr("y", -48)
              .style("text-anchor", "end")
              .text("Cost of abatement")           
            yAxisGroup.append("text")
              .attr("class", "subLabel")
              .attr("transform", "rotate(-90)")
              .attr("y", -33)
              .style("text-anchor", "end")
              .text("$ per tonne of carbon")   

        // Add Block labels
        // let optionLabelGroup = svg.append("g")
        //       .attr("class", "optionLabelGroup")
        //     optionLabelGroup.selectAll(".optionLabel")
        //       .data(d)
        //       .enter().append("text")
        //       .style('opacity',0)
        //       .attr("class", function(d){ return d.class+" optionLabel" })
        //       .attr("id", function(d){ return d.id+"optionLabel"})
        //       .attr("x", function(d){ return x(d.abatementCumulative + (d.abatement/2) ); })
        //       .attr("y", function(d){ return d[levelisedCost] > 0 ? y(d[levelisedCost]) - 10*0 : y(d[levelisedCost]) + 15*0; })
        //       .attr("dy", function(d){ return d.dyLabel })
        //       .text(function(d){ return d.name} )
        //       .call(wrap, 50, 1)
        //       .transition().duration(500)
        //         .delay(function(d, i) { return  i * animationTime / blockIDs.length ; })
        //         .style('opacity', 1)

        // Add Legend
        drawLegend(optionTypeList, animationTime)
      }; // end DrawMACC


      // Function to draw GreenPower
      function offsetLine(price, className) {

        let lineData = [ {"x": 0, "y": price},
                         {"x": targetEmissions, "y": price} ]

        let line = d3.line()
            .x(function(d) { return x(d.x) })
            .y(function(d) { return y(d.y) });

        svg.append('path')
          .attr('class', 'offsetLine '+className)
          .attr("d", line(lineData))
      };

      // Function to draw GreenPower
      function targetLine(target, className) {
        let lineData = [ {"x": target, "y": 0 },
                         {"x": target, "y": height} ]

        let line = d3.line()
            .x(function(d) { return x(d.x) })
            .y(function(d) { return y(d.y) });

        svg.append('path')
          .attr('class', 'offsetLine '+className)
          .attr("d", line(lineData))
      };


      //  Draw the Legend
      function drawLegend(d, animationTime){
        let legend = svg.append('g').attr('id', 'legend')

        legend.selectAll(".block.legend").data(d)
          .enter().append("rect")
            .attr('id', function(d){ return 'legendBlock'+camelize(d)})
            .attr('class', function(d){ return 'block legend '+camelize(d)})
            .attr("x", function(d){  return width - margin.right - 120; })
            .attr("y", function(d, i){ return  (height - margin.bottom*2) + 17 * i; })
            .attr("width", 15)
            .attr("height", 15)
            .style("opacity", 0)
          .transition().duration(animationTime/3)
            .style("opacity", 1)

        legend.selectAll(".label.legend").data(d)
          .enter().append("text")
            .attr('class', function(d){ return 'label legend '+camelize(d)})
            .attr("x", function(d){  return width - margin.right - 100; })
            .attr("y", function(d, i){ return  (height- margin.bottom*2) + 17 * i; })
            .attr("dy", "0.75rem")
            .text(function(d){return d})
            .style("opacity", 0)
          .transition().duration(animationTime/3)
            .style("opacity", 1)    

        // d3.select('#legend').attr('transform', 'translate(-20, -50)')
      }; // end drawLegend


      // Function to scribble option blocks
      function scribbleBlocks(blockIDArray, offset, wobblePct, animationLength, settings,levelisedCost){    
        for(i = 0; i < blockIDArray.length; i++){
          let rectID = blockIDArray[i],
              wobbleRectPath = rectToPath(blockIDArray[i], offset, wobblePct);
          
          d3.select("#"+rectID).style('opacity', 0)
      
          svg.append('path').attr('id', rectID+'dummy')     // Dummy path used to get length 
            .attr('d', wobbleRectPath)
            .attr('display', 'none')

          let scribbleLen = document.getElementById(rectID+'dummy').getTotalLength();
          d3.select("#"+rectID+'dummy').remove()      // Removes dummy after use

          let data = masterData[i];
          svg.append('path')
            .attr('class', blockClasses[i]+' scribbleBlock')
            .attr('id', rectID+'scribbleBlock')
            .attr('d', wobbleRectPath)        
            .attr("stroke-dasharray", scribbleLen + " " + scribbleLen)
            .attr("stroke-dashoffset", scribbleLen)
              .on("mouseover", function() {toolTipOn(data, d3.event.pageX, d3.event.pageY, levelisedCost) })          
              .on("mouseout", toolTipOff)             
          .transition().duration(animationLength).delay(i*animationLength)
            .ease(d3.easeCubic)
            .attr("stroke-dashoffset", 0)    
        };

        for(index = 0; index < blockIDArray.length; index++){              
          drawScribble(blockIDArray[index], animationLength, index, offset, settings)  
        };
      }; // end scribbleBlocks()


      // Function to scribble legend blocks
      function scribbleLegendBlocks(blockIDArray, offset, wobblePct, animationLength, settings){    
        d3.selectAll('.legend').data(optionTypeList)
          .attr('class' , function(d){return camelize(d)+' scribbleBlock energyEfficiency legend' })

        for(index = 0; index < blockIDArray.length; index++){              
          drawScribble(blockIDArray[index], animationLength, index, offset, settings)  
        };
      }; // end scribbleBlocks()


    // Tooltip for blocks
      function toolTipOn(d, x, y, levelisedCost) {
        tooltipDiv  
          .html("<span class= 'tooltipHeader'>"+ d.name +"</span><p class = 'tooltipText'>Contribution to ZNET: "+ Math.round(d.abatement / baselineEmissions * 1000)/10 +"%</p><p class = 'tooltipText'>Emissions abatement: "+formatComma(d.abatement) +" t CO2e p.a. </p><p class = 'tooltipText'>Cost per tonne: $"+d['levelisedCost'] +" per t CO2e </p><p class = 'tooltipText'>About this option:<br>"+d.description +"<br>" )
          .style("left", (x) + "px")   
          .style("top", (y + 10) + "px")
          .transition().duration(200)    
            .style("opacity", .75);   
      };
      function toolTipOff(){
          tooltipDiv.transition().duration(500)    
            .style("opacity", 0)
      };


    ////////////////////////////////////////
    // Functions to support View options  //
    ////////////////////////////////////////

      let logoIDs = ['logo-circle', 'logo-z', 'logo-n', 'logo-e', 'logo-t']
      let sketchCounter = 0,
          offset = 1;

      // Crisp Sketch
      function sketchCrisp(animationTime, levelisedCost){
        d3.selectAll('.legend.scribbleBlock').classed('scribbleBlock', false)       // Make sure legend block is not removed
        d3.selectAll('.scribbleFill, .scribbleBlock, .optionLabelGroup').remove();
        d3.selectAll('.label, .subLabel, .axis, .main-header, .sub-header, .optionLabel').classed('sketch', false)      // Change text to handwritten
        d3.selectAll('.block, .block.legend').transition().duration(1000).style('opacity', null).attr('pointer-events', 'all')
       
        // let optionLabelGroup = svg.append("g")
        //       .attr("class", "optionLabelGroup")
        //     optionLabelGroup.selectAll(".optionLabel").data(masterData)
        //       .enter().append("text")
        //       .style('opacity',0)
        //       .attr("class", function(d){ return d.class+" optionLabel" })
        //       .attr("id", function(d){ return d.id+"optionLabel"})
        //       .attr("x", function(d){ return x(d.abatementCumulative + (d.abatement/2) ); })
        //       .attr("y", function(d){ return d[levelisedCost] > 0 ? y(d[levelisedCost])  : y(d[levelisedCost]) ; })
        //       .attr("dy", function(d){ return d.dyLabel })
        //       .text(function(d){ return d.name} )
        //         .call(wrap, 50, 1)
        //       .transition().duration(animationTime)
        //         .style('opacity', 1)  

      }; //. end sketchCrisp

      // Pencil sketch
      function sketchPencil(animationTime, levelisedCost){
        resetSketch(animationTime, levelisedCost)
        let settings = {
          "svg"             : svgFills,         // Node of the SVG element
          "segmentDetail"   : 150,              // Sets number of points used in outline polygon (use more for complex shapes)
          "scribbleAngle"   : null,             // Set to Null for random
          "lineFrequency"   : 0.5,              // Sets width between scribble lines
          "lineRandomness"  : 0.5,              // Affects 'messiness'
          "curve"           : d3.curveCardinal.tension(1),
          "animationLength" : 2000,
          "fuzzer"          : d3.scaleLinear().domain([0, 300000]).range([5, 25])
        };

        if(sketchCounter === 1){offset = 0 ; }    // Test for whether sketch with offset has already been render
        sketchCounter = 1
        scribbleBlocks(blockIDs, offset, 1, animationTime, settings, levelisedCost)    // Slight offset in block placement and low wobblePcT
        scribbleLegendBlocks(legendIDs, 0, 1, animationTime, settings)     
      }; // end sketchPencil()

      // Scribble sketch
      function sketchScribble(animationTime, levelisedCost){          
        resetSketch(animationTime)
        let settings = {
          "svg"             : svgFills,         // Node of the SVG element
          "segmentDetail"   : 150,              // Sets number of points used in outline polygon (use more for complex shapes)
          "scribbleAngle"   : null,             // Set to Null for random
          "lineFrequency"   : 2,                // Sets width between scribble lines
          "lineRandomness"  : 5,                // Affects 'messiness'
          "curve"           : d3.curveCardinal.tension(0.5),
          "animationLength" : 2000,
          "fuzzer"          : d3.scaleLinear().domain([0, 300000]).range([5, 25])
        };

        if(sketchCounter === 1){offset = 0 ; }    // Test for whether sketch with offset has already been render
        sketchCounter = 1        
        scribbleBlocks(blockIDs, offset, 1, animationTime, settings, levelisedCost)
        scribbleLegendBlocks(legendIDs, 0, 1, animationTime, settings)           
      }; // end sketchScribble()


      // Messy sketch
      function sketchMessy(animationTime, levelisedCost){          
        resetSketch(animationTime)

        let settings = {
          "svg"             : svgFills,         // Node of the SVG element
          "segmentDetail"   : 150,              // Sets number of points used in outline polygon (use more for complex shapes)
          "scribbleAngle"   : null,             // Set to Null for random
          "lineFrequency"   : 2,                // Sets width between scribble lines
          "lineRandomness"  : 10,                // Affects 'messiness'
          "curve"           : d3.curveCardinal.tension(0.2),
          "animationLength" : 2000,
          "fuzzer"          : d3.scaleLinear().domain([0, 300000]).range([5, 25])
        };

        if(sketchCounter === 1){offset = 0 ; }    // Test for whether sketch with offset has already been render
        sketchCounter = 1        
        scribbleBlocks(blockIDs, offset, 5, animationTime, settings, levelisedCost)
        scribbleLegendBlocks(legendIDs, 0, 1, animationTime, settings)           
      };


      // Helper to Reset sketch and re-label with handwritten labels
      function resetSketch(animationTime, levelisedCost){
        d3.selectAll('.legend.scribbleBlock').classed('scribbleBlock', false)
        d3.selectAll('.scribbleFill, .scribbleBlock, .optionLabelGroup').remove();
        d3.selectAll('.legendBlock').style('opacity',0);
        d3.selectAll('.label, .subLabel, .axis, .main-header, .sub-header, .optionLabel')
          .classed('sketch', true)      // Change text to handwritten
        d3.selectAll('.block').attr('pointer-events', 'none')

        //Add handwritten labels
        // let optionLabelGroup = svg.append("g")
        //       .attr("class", "optionLabelGroup")
        //     optionLabelGroup.selectAll(".optionLabel").data(masterData)
        //       .enter().append("text")
        //       .style('opacity',0)
        //       .attr("class", function(d){ return d.class+" optionLabel sketch" })
        //       .attr("id", function(d){ return d.id+"optionLabel"})
        //       .attr("x", function(d){ return x(d.abatementCumulative + (d.abatement/2) ); })
        //       .attr("y", function(d){ return d[levelisedCost] > 0 ? y(d[levelisedCost])  : y(d[levelisedCost]) ; })
        //       .attr("dy", function(d){ return d.dyLabel })
        //       .text(function(d){ return d.name} )
        //         .call(wrap, 50, 1)
        //       .transition().duration(500)
        //         .delay(function(d, i) { return i * animationTime })
        //         .style('opacity', 1)          

        //Restablish legend (which gets replaced with sketched version)

      } // end resetSketch()



    ///////////////////////
    // Helper functions  //
    ///////////////////////

      // Parse data: add ID anc class fields and sort to least cost order
      function parseData(d){
        targetEmissions =  +d[0]['targetEmissions']
        baselineEmissions =  +d[0]['baselineEmissions']

        for(i = 0; i < d.length; i++){
          let obj = d[i];
          obj.levelisedCost = +obj.levelisedCost; 
          obj.abatement = +obj.abatement; 

          // Add ID and classes
          let camelName = camelize(obj.name)
              camelType = camelize(obj.type)
              camelSector = camelize(obj.sector)
              camelArea = camelize(obj.area)

          obj.id = camelName; 
          obj.class = camelType+" "+camelSector+" "+camelArea 
        };

        // Sort objects in array by levelised cost (lowest first)
        d.sort(function(a,b) {return (a.levelisedCost > b.levelisedCost) ? 1 : ((b.levelisedCost > a.levelisedCost) ? -1 : 0);} ); 
       
        // Add a cumulative abatement
        cumAbatement = 0
        for(i = 0; i < d.length; i++){
          let obj = d[i]
          obj.abatementCumulative = cumAbatement;
          cumAbatement = cumAbatement + obj.abatement;
        };


        //Build BlockIDs and blockClasses arrays in least cost order
        for(i = 0; i < d.length; i++){
          let obj = d[i];

            let id =obj.id;
              id = id.replace("(","")
              id =id.replace(")","")
              id = id.replace("/","")
              id = id.replace(".","")
              id = id.replace(":","")

          blockIDs.push(id)           // build BlockIDs array


          blockClasses.push(obj.class)    // build blockClasses array    
          optionTypeList.push(obj.type)    // build option list type array    
        };

        // Create unique list
        optionTypeList = optionTypeList.filter(onlyUnique).sort()
        for(i=0;i < optionTypeList.length; i++){
            legendIDs[i] = "legendBlock"+camelize(optionTypeList[i])
          };
      
        // Pass data to global variable
        masterData = d;
      }; // end parseData

      // Helper function to camelcase fields for ID and class names
      function camelize(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
          if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
          return index == 0 ? match.toLowerCase() : match.toUpperCase();
        });
      }; // end camelize

      // Helper to generate unique lists from arrays
      function onlyUnique(value, index, self) { 
          return self.indexOf(value) === index;
      }; // end onlyUnique()

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
