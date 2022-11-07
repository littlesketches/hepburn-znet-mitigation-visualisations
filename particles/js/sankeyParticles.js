/////////////////////////////////////////////////////////////////////////////////////////
// Experimental Particle Sankey for emissions and energy use in Hepburn Shire         //
// Hacked together by Little Sketches with the layout code based on Eljack Meeks      //
// Particle Snankey work > https://bl.ocks.org/emeeks/9673c96a682fe3948379            //
// (so all credits to Elijah!)                                                        //
// This has beedn updated for d3.v5 with Sheets/Tabletop data source and parser       //
// added, together                                                                    //
// MIT License applies                                                                //
////////////////////////////////////////////////////////////////////////////////////////

  // Setup vis
    let margin = {top: 50, right: 220, bottom: 50, left: 90},
        width = 1400 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    let formatNumber = d3.format(",.0f"),
        formatCO2 = function(d) { return formatNumber(d) + " tCO2-e"; };
        formatTJ = function(d) { return formatNumber(d) + " TeraJoules"; };

    let color = d3.scaleOrdinal(d3.schemeSet3);    

    let svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g").attr('id','chart')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let annotation = d3.select('#svgVis').append('g').attr('id', 'annotationGroup'),
        annotationLabels = [],                // stores labels for sankeybar groups 
        annotationParagraphs = []             // stores the explanatory paragaphs

    let sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .size([width, height]);

    let path = sankey.link(),
        link,
        freqCounter = 1;

    let graphEmissions = {"nodes" : [], "links" : [] },
        graphEnergy = {"nodes" : [], "links" : [] },
        nodeIDs = [],
        totalEmissions = 0, totalEnergy = 0,
        view;

    
/////////////////////////
/// Setup page onload ///
/////////////////////////
    
  window.addEventListener('DOMContentLoaded', init)                       // Load project data from google sheet: using tabletop 
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
          setStartView()
          Tabletop.init({
              key: public_spreadsheet_url,
              callback: function(data, tabletop){
                view = 'emissions'
                parseData(data, graphEmissions, 'emissions');       // Parse source data to emissions graph data format      
                parseData(data, graphEnergy, 'energy')             // Parse source data to energy graph data format             
                renderVis(view);
              },
              simpleSheet: true,
              wanted: ['sankey']
          });  
        } // end renderFromGS()
        
        function renderFromTSV(){
              d3.tsv("data/sankey.txt").then(function(data) {
                view = 'emissions'
                parseData(data, graphEmissions, 'emissions');       // Parse source data to emissions graph data format      
                parseData(data, graphEnergy, 'energy')             // Parse source data to energy graph data format             
                renderVis(view);
          });                 
        } // end renderFromTSV


  // Parse data from CSV/JSON to graph format (dataOUT)
  function parseData(dataIN, dataOUT, value){
    //set up graph in same style as original example but empty

      dataIN.forEach(function (d) {
        if(d.linkLevel !== ""){ annotationLabels.push(d.linkLevel) ; }
        if(d.annotationParagraphs !== ""){ annotationParagraphs.push(d.annotation) ; }
      });
      annotationLabels = annotationLabels.filter(unique)
      annotationParagraphs = annotationParagraphs.filter(unique)

      dataIN.forEach(function (d) {
        if(+d[value] > 0){  
          dataOUT.nodes.push({ "name": d.source });
          dataOUT.nodes.push({ "name": d.target });
          dataOUT.links.push({ "source": d.source,
                             "target": d.target,
                             "value": +d[value]
                           });
           // Update the counter to sum the value     
          if(value === 'emissions'){
            totalEmissions = totalEmissions + (+d[value]) / (annotationLabels.length - 1);         
          } else if (value === 'energy'){
            totalEnergy = totalEnergy + (+d[value]) / (annotationLabels.length - 1);    
          };
        };
      });

    // return only the distinct / unique nodes
      dataOUT.nodes = d3.keys(d3.nest()
        .key(function (d) { return d.name; })
        .object(dataOUT.nodes));

      // loop through each link replacing the text with its index from node
      dataOUT.links.forEach(function (d, i) {
        dataOUT.links[i].source = dataOUT.nodes.indexOf(dataOUT.links[i].source);
        dataOUT.links[i].target = dataOUT.nodes.indexOf(dataOUT.links[i].target);
      });

      // now loop through each nodes to make nodes an array of objects
      // rather than an array of strings
      dataOUT.nodes.forEach(function (d, i) {
        dataOUT.nodes[i] = { "name": d, "id": camelize(d)+'Node'};
        nodeIDs.push(camelize(d)+'Node')
      });
  }// end parseData()


////////////////////////////////////
/// Rendering the Visualisation ////
////////////////////////////////////

  // Function to render the vis
  function renderVis(chartType) {   

    // Remove any existing chart and annotation
    d3.select('#chart').selectAll("*").remove()
    d3.select('#annotationGroup').selectAll("*").remove()

    // Switch between Emissions and Energy
    let totalCounter, dataGraph
    if (chartType === 'emissions') { 
      dataGraph = graphEmissions;                           // Set the graphing data to emissions
      totalCounter = totalEmissions;                        // Set total counter to emission to work out Pcts for labels
      format = formatCO2;                                   // Format labels for t CO2-e
      annotateEmissions()                                   // Set Annotation fo0r Emissions
    } else if(chartType === 'energy'){       
      dataGraph = graphEnergy                               // Set the graphing data to energy
      totalCounter = totalEnergy                             // Set total counter to emission to work out Pcts for labels
      format = formatTJ;                                    // Format labels for TeraJoules
      annotateEnergy()                                     // Set Annotation fo0r Emissions
    };

    // Create sankey layout
      sankey
        .nodes(dataGraph.nodes)
        .links(dataGraph.links)
        .layout(25);
    // Append links with labels
      link = svg.append("g").selectAll(".link")
          .data(dataGraph.links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("stroke-width", d => Math.max(1, d.dy))

      link.append("title")
          .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value) + " (" + Math.round(d.value / totalCounter * 1000)/10+'%)'; })

    // Append the nodes
      let node = svg.append("g").selectAll(".node")
            .data(dataGraph.nodes)
          .enter().append("g")
            .attr("id", function(d){return d.id+'Group'})      
            .attr("class", "node")  
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })            
          .call(d3.drag()
            .on("start", function() { this.parentNode.appendChild(this); })
            .on("drag", dragmove))

      node.append("rect").attr("id", function(d){return d.id})        
          .attr("height", function(d) { return d.dy; })
          .attr("width", sankey.nodeWidth())
          .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
          .style("stroke", "none")
        .append("title")
          .text(function(d) { return d.name + "\n" + format(d.value) + " (" + Math.round(d.value / totalCounter * 1000)/10+'%)'; })

    // Add labels on right side 
      node.append("text")
          .attr("x",  6 + sankey.nodeWidth())
          .attr("y", function(d) { return d.dy / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", "start")
          .attr("transform", null)
          .text(function(d) { return d.name; })
        .filter(function(d) { return d.x < width / 4; })
          .attr("x", -6)
          .attr("text-anchor", "end")
          .call(wrap, margin.left-10, 1)

      // Setup particles
      let linkExtent = d3.extent(dataGraph.links, function (d) {return d.value}),
          frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05,1]),
          particleSize = d3.scaleLinear().domain(linkExtent).range([1,5]);

      dataGraph.links.forEach(function (link) {
        link.freq = frequencyScale(link.value);
        link.particleSize = 2;
        link.particleColor = d3.scaleLinear().domain([0,1])
        .range([link.source.color, link.target.color]);
      })

    // Fade in the nodes and links and annotation
      node
        .style('opacity',0) 
        .transition().duration(500)
          .style('opacity',1);     

      link
        .style('opacity',0) 
        .transition().duration(500)
          .style('opacity',1);   
  
  }; // end renderVis()

  // Function to drag nodes
  function dragmove(d) {
    // d3.select(this).attr("transform", "translate(" + (d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))) + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);     
  };  // end dragmove

  // Draw canvas to filter particle effect
    let t = d3.timer(tick, 1500),
        particles = [],
        tickSpeed = 0.1

    // Setup timer for particles
    function tick(elapsed, time) {
      particles = particles.filter(function (d) {return d.current < d.path.getTotalLength()});

      d3.selectAll("path.link").each(       
        function (d) {
          var offset = (Math.random() - 0.5) * d.dy;
          if (Math.random() < d.freq) {
            var length = this.getTotalLength();
            particles.push({
                link: d, 
                time: elapsed, 
                offset: offset, 
                path: this, 
                length: length, 
                animateTime: length
            })
          }
      });

      particleEdgeCanvasPath(elapsed);
    }; // end tick()

    // Prepare canvas element to show particles
    function particleEdgeCanvasPath(elapsed) {
      let context = d3.select("canvas").node().getContext("2d"),
          clearingMargin = 5

      context.clearRect(-clearingMargin , -clearingMargin ,width + 2*clearingMargin, height + 2*clearingMargin);

      for (let x in particles) {
          let currentTime = elapsed - particles[x].time;

          particles[x].current = currentTime * tickSpeed;
          let currentPos = particles[x].path.getPointAtLength(particles[x].current);
          context.beginPath();
        
        context.fillStyle = particles[x].link.particleColor(particles[x].current/particles[x].path.getTotalLength());
          context.arc(currentPos.x,currentPos.y + particles[x].offset,particles[x].link.particleSize,0,2*Math.PI);
          context.fill();
      }
    }; // end particleEdgeCanvasPath ()

    // Nove canvas with margins
    let c = document.getElementById("canvasVis"),
        ctx = c.getContext("2d");
    ctx.translate(margin.left, margin.top);


// Custom view functions

  // Function to be developed to custom move node placement for better clarity
  function moveNode(d) {
    d.node().parentNode.appendChild(d.node());

    let nodeGroupID = d._groups[0][0]['id'],
        nodeID = nodeGroupID.slice(0, nodeGroupID.length - 5),
        nodeIDindex = nodeIDs.indexOf(nodeID),
        data = graph['nodes'][nodeIDindex]
    
    sankey.relayout();
  
    link.attr("d", path);    
  };

  // Function to annotate the SVG with title, labels and commentary for emissions
  function annotateEmissions(){
    // Append Annotation
    annotation.append('text').attr('class','title')
      .text('emission particles')
      .attr('x', margin.left)
      .attr('y', margin.top) 
      .style('opacity',0)
        .transition().duration(500)
        .style('opacity',1)
    // Move switchButton
    annotation.append('text').attr('id', 'switchButton')
      .attr('class','title')
      .text('>')
      .attr('x', 0)
      .attr('y', margin.top)
      .on('click', switchView)      
      .transition().duration(1500)     
      .attr('x', margin.left + 380)

    // Append commentary
    annotation.append('text').attr('class','annotation')
      .text(annotationParagraphs[0]+ Math.round(totalEmissions/1000) +annotationParagraphs[1])
      .attr('x', margin.left)
      .attr('y', margin.top + 20) 
      .attr("dy", ".35em")
      .call(wrap, 400, 1.2)

    // Append labels
    annotation.selectAll('.annotationLabel')
      .data(annotationLabels)
      .enter().append('text').attr('class','annotationLabel')
      .text(function(d, i){ return d ;} )
      .attr('x', function(d, i){return margin.left + i * width / (annotationLabels.length - 1)} )
      .attr('y', margin.top + height + margin.bottom *0.4) 
      .attr("dy", ".35em")
      .call(wrap, 80, 1.2)   

    // Fade in
    annotation
      .style('opacity',0)
        .transition().duration(1500)
        .style('opacity',1)
  }; // end annotateEmissions()

  function annotateEnergy(){
    // Append Annotation
    annotation.append('text').attr('class','title')
      .text('energy particles')
      .attr('x', margin.left)
      .attr('y', margin.top) 

    annotation.append('text').attr('id', 'switchButton')
      .attr('class','title')
      .text('>')
      .attr('x', 0)
      .attr('y', margin.top)
      .on('click', switchView)      
      .transition().duration(1500)     
      .attr('x', margin.left + 330)

    // Append commentary
    annotation.append('text')
      .attr('class','annotation')
      .text(annotationParagraphs[2]+ Math.round(totalEnergy) +annotationParagraphs[3])
      .attr('x', margin.left)
      .attr('y', margin.top + 20) 
      .attr("dy", ".35em")
      .call(wrap, 400, 1.2)

    // Append labels
    annotation.selectAll('.annotationLabel')
      .data(annotationLabels)
      .enter().append('text').attr('class','annotationLabel')
      .text(function(d, i){ return d ;} )
      .attr('x', function(d, i){return margin.left + i * width / (annotationLabels.length - 1)} )
      .attr('y', margin.top + height + margin.bottom *0.4) 
      .attr("dy", ".35em")
      .call(wrap, 80, 1.2)        
    
    // Fade in
    annotation
      .style('opacity',0)
        .transition().duration(1500)
        .style('opacity',1)
  }; // end annotateEmissions()



  function switchView(){
    if(view === 'emissions') {      
      renderVis('energy')
      view = 'energy'
    } else if(view === 'energy'){
      renderVis('emissions')
      view = 'emissions'
    }
  }; // endSwitchView



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

  // Helper to wrap text labels
    function wrap(text, width, lineHeight) {
console.log(text)
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

  // Helper function to camelcase fields for ID and class names
    function camelize(str) {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
      });
    }; // end camelize()

    let unique = (value, index, self) => {
        return self.indexOf(value) === index;
    }



