//////////////////////////////////////////////////////////////////////////////////////////////
/// Custom Sketchy drawing library hacking togehether methods for turning clean SVGs into  ///
//////////////////////////////////////////////////////////////////////////////////////////////

/* This is a mashup library that hacks together the (hard) work and clever imeplementations of methods for 
giving SVG drawings a 'hand drawn' look via programmatic path altering (i.e. using Javascript).

This has been made for fun, convenience and to learn more about the techniques 

Aims (future features)
	- Be able to choose between sketchy rendering algorithm (note:  the 'cheap' sketchy is far more performant, but doesn't work too well with concave/complex shapes)
	- Be able to transition between 'crispy' and 'sketchy' views 


- Lines
  

- Fills
 


// Stands on shoulders of:
	// Jo Wood et al's Handy library for Processing
	// Sebastian Meier's d3.sketchy library
	// Elijah Meeks cheap sketchy functions (for d3 and Semiotic)
	// Noah Veltman's implementation of John Turnbes (expired) patent for scribble filling vector shapes
	// Dan Foreman-Mackey's xkcd style line interpolator
	// Licenses (MIT) apply for d3.sketchy and Noah Veltmans original scribble code

 */


/////////////////////////////////////////////
// SKETCHY LINES AND FILL FROM d3.sketchy ///
// Produces a pencil like sketch and fill ///
// which is clipped to the fill shape.    ///
/////////////////////////////////////////////

	let d3sketchy = function(){

		let defaults = {					// Set of defaults for sketch fill
			x:0,
			y:0,
			width:20,
			height:20,
			sketch:1,
			density:1,
			radius:10,
			angle: 10,
			count:2,
			shape:"circle",
			clip:"",
			margin:2
		};

		// Changing the default attributes if options are provided
		function setDefaults(opts){
			defaults = extend(defaults, opts);
			return defaults;
		}; // end setDefaults
		
		// Helper functions
		// Merging two objects, source will replace duplicates in destination
		function extend(destination, source) {
			var returnObj = {}, attrname;
			for (attrname in destination) { returnObj[attrname] = destination[attrname]; }
			for (attrname in source) { returnObj[attrname] = source[attrname]; }
			return returnObj;
		};

		function rand(min, max){
			return Math.random()* (max-min) + min;
		};

		/* Create sketchy @constructor*/
		function sketchy(){}
		 	/* drawing a sketchy line
			 * this is kind of the heart of the whole tool.
			 * so if you want to make changes to the appearance of the lines, tweak the following lines
				* @param {object} opts
				* @param {d3.selection} opts.svg
				* @param {float|int} opts.x1 - x point 1
				* @param {float|int} opts.y1 - y point 1
				* @param {float|int} opts.x2 - x point 2
				* @param {float|int} opts.y2 - y point 2
				* @param {object} opts.sketch
				* @param {object} opts.sketch.x - sketchiness on the x-axis
				* @param {object} opts.sketch.y - sketchiness on the y-axis
			 */
		
		sketchy.drawLine = function(opts){
			//Each line is drawn twice the increase sketchiness
			for(var i = 1; i<3; i++){

				var or2 = rand(0.2, 0.8);

				var cx2 = opts.x1+ (opts.x2-opts.x1)*or2+rand(-1,1);
				var cy2 = opts.y1+ (opts.y2-opts.y1)*or2+rand(-1,1);

				var or1 = or2 + rand(-0.3, -0.2);

				var cx1 = opts.x1+ (opts.x2-opts.x1)*or1+rand(-1,1);
				var cy1 = opts.y1+ (opts.y2-opts.y1)*or1+rand(-1,1);

				opts.svg.append("path")
					.attr("d", "M"+
									(opts.x1 + rand(-1,0)*opts.sketch.x/i)+" "+
									(opts.y1 + rand(-1,1)*opts.sketch.y/i)+" Q"+
									cx1+" "+cy1+" "+
									cx2+" "+cy2+" T"+
									(opts.x2 + rand(0,1)*opts.sketch.x/i)+" "+
									(opts.y2 + rand(-1,1)*opts.sketch.y/i));

			} // end for loop i
		}; // end drawLine()

		sketchy.drawLineSinglePath = function(opts){
			//Each line is drawn twice the increase sketchiness
			var sketching = "";
			for(var i = 1; i<3; i++){

				var or2 = rand(0.2, 0.8);

				var cx2 = opts.x1+ (opts.x2-opts.x1)*or2+rand(-1,1);
				var cy2 = opts.y1+ (opts.y2-opts.y1)*or2+rand(-1,1);

				var or1 = or2 + rand(-0.3, -0.2);

				var cx1 = opts.x1+ (opts.x2-opts.x1)*or1+rand(-1,1);
				var cy1 = opts.y1+ (opts.y2-opts.y1)*or1+rand(-1,1);

				sketching += " M"+
									(opts.x1 + rand(-1,0)*opts.sketch.x/i)+" "+
									(opts.y1 + rand(-1,1)*opts.sketch.y/i)+" Q"+
									cx1+" "+cy1+" "+
									cx2+" "+cy2+" T"+
									(opts.x2 + rand(0,1)*opts.sketch.x/i)+" "+
									(opts.y2 + rand(-1,1)*opts.sketch.y/i);
			}
			return sketching;
		}; // enddrawLineSinglePath()

			/* drawing a circle shape
			 * no outline just the fill
				* @param {object} opts - object containing the attributes
				* @param {float|int} opts.x - x position
				* @param {float|int} opts.y - y position
				* @param {float|int} opts.r - radius
				* @param {float|int} opts.angle - angle of the lines (0-360)
				* @param {float|int} opts.density - distance between lines
				* @param {float|int} opts.sketch - sketchiness factor
				* @param {string} opts.shape - this is a development relic, default is "circle", alternatives "cut" and "star"
				* @return {object} svg - d3.selection of a group object, containing the circle
			*/
		sketchy.circleFill = function(opts){
			//merging default attributes with user attributes
			var merged_opts = extend(defaults, opts);

			//create a container, this is used to translate and rotate the circle, this container will be returned at the end of this function
			var svg = merged_opts.svg.append("g").attr("transform", "translate("+merged_opts.x+" "+merged_opts.y+") rotate("+merged_opts.angle+")");

			var fillLines = "";

			//Looping through the lines
			var y_dist = 0;
			while(y_dist > -2*opts.r){
				var x;
				//During the development i accidentaly generated those shapes and kept them :)
				if(merged_opts.shape==="cut"){
					x = Math.sqrt( ( Math.pow(merged_opts.r, 2) - Math.pow((merged_opts.r-Math.abs(y_dist)), 2) ) );
				}else if(merged_opts.shape==="star"){
					x = merged_opts.r - Math.sqrt( ( Math.pow(merged_opts.r, 2) - Math.pow((merged_opts.r-Math.abs(y_dist)), 2) ) );
				}else{
					x = Math.sqrt( ( Math.pow(merged_opts.r, 2) - Math.pow((merged_opts.r-Math.abs(y_dist)), 2) ) );
				}

				//Draw the sketchy lines
				fillLines += sketchy.drawLineSinglePath({
					svg:svg,
					x1:-x,
					y1:y_dist+merged_opts.r,
					x2:x,
					y2:y_dist+merged_opts.r,
					sketch:{
						x:merged_opts.density*merged_opts.sketch,
						y:merged_opts.density*merged_opts.sketch
					}
				});

				y_dist -= merged_opts.density;
			}

			svg.append("path").attr("d", fillLines);

			return svg;
		};

		/**
		* draws a rectangle
		* no outline just the fill
		* @param {object} opts - object containing the attributes
		* @param {float|int} opts.x - x position
		* @param {float|int} opts.y - y position
		* @param {float|int} opts.width - width
		* @param {float|int} opts.height - height
		* @param {float|int} opts.angle - angle of the lines (0-360)
		* @param {float|int} opts.density - distance between lines
		* @param {float|int} opts.sketch - sketchiness factor
		* @return {object} svg - d3.selection of a group object, containing the rectangle
		*/
		sketchy.rectFill = function(opts){
			var svg = opts.svg.append("g").attr("transform", "translate("+opts.x+" "+opts.y+")");
			opts.svg = svg;
			return sketchy.drawPattern(opts);
		};

		/**
		* draws a background pattern in the shape of a square according to x,y,with,height
		* @param {object} opts - object containing the attributes
		* @param {float|int} opts.x - x position
		* @param {float|int} opts.y - y position
		* @param {float|int} opts.width - width
		* @param {float|int} opts.height - height
		* @param {float|int} opts.angle - angle of the lines (0-360)
		* @param {float|int} opts.density - distance between lines
		* @param {float|int} opts.sketch - sketchiness factor
		* @return {object} svg - d3.selection of a group object, containing the background
		*/
		sketchy.drawPattern = function(opts, pathFillMode){
			var svg = opts.svg;

			var drawCode = "";

			//angle for strokes
			var angle = opts.angle;
			while(angle > 360){angle -= 360;}
			if(angle > 180){angle -= 180;}
			var radian = (Math.PI/180)*(90-angle);
			var vector = {
				y:1,
				x:-1/Math.tan(radian)
			};

			//distance between strokes
			var dist = opts.density;
			var vy, tx, ty, vx, y1, x1, y_dist, x_dist;

			// code to allow fill mode for paths to accept bounding box x and y, and reset for shape fills
			if (pathFillMode !== true){
				opts.x = 0;
				opts.y = 0;			
			};


			var x = opts.x, y = opts.y;
			if(Math.abs(angle) === 90){
				while(y < opts.y+opts.height){
					drawCode += sketchy.drawLineSinglePath({
						svg:svg,
						x1:x,
						y1:y,
						x2:x+opts.width,
						y2:y,
						sketch:{
							x:dist*opts.sketch,
							y:dist*opts.sketch
						}
					});
					y += dist;
				}
			}else if((Math.abs(angle) === 180)||(angle === 0)){
				while(x < opts.x+opts.width){
					drawCode += sketchy.drawLineSinglePath({
						svg:svg,
						x1:x,
						y1:y,
						x2:x,
						y2:y+opts.height,
						sketch:{
							x:dist*opts.sketch,
							y:dist*opts.sketch
						}
					});
					x += dist;
				}
			}else if(angle < 90){
				y_dist = Math.abs(dist / Math.sin(Math.PI/180*angle));
				x_dist = Math.abs(dist / Math.sin(Math.PI/180*(90-angle)));

				y += y_dist;
				y1 = opts.y;
				x1 = opts.x;
				while(y1 < opts.y+opts.height){
					vx = opts.width / vector.x;
					x1 = opts.width + x;
					y1 = y + vector.y * vx;
					ty = y;
					tx = x;

					if(y1<opts.y){
						vy = (y-opts.y)/vector.y;
						x1 = x + Math.abs(vector.x) * vy;
						y1 = opts.y;
					}else if(y > (opts.y+opts.height)){
						ty = opts.y+opts.height;
						vy = (ty-y1)/vector.y;
						tx = x + opts.width - vy*Math.abs(vector.x);
					}

					drawCode += sketchy.drawLineSinglePath({
						svg:svg,
						x1:tx,
						y1:ty,
						x2:x1,
						y2:y1,
						sketch:{
							x:x_dist*opts.sketch,
							y:y_dist*opts.sketch
						}
					});

					y += y_dist;
				}

			}else{
				y_dist = Math.abs(dist / Math.sin(Math.PI/180*angle));
				x_dist = Math.abs(dist / Math.sin(Math.PI/180*(180-angle)));

				y = opts.y+opts.height;
				y -= y_dist;
				y1 = opts.y+opts.height;
				x1 = opts.x;
				while(y1 > opts.y){
					vx = opts.width / vector.x;
					x1 = opts.width + x;
					y1 = y + vector.y * vx;
					ty = y;
					tx = x;

					if(y1>(opts.y+opts.height)){
						vy = (y-(opts.y+opts.height))/vector.y;
						x1 = x + Math.abs(vector.x * vy);
						y1 = opts.y+opts.height;
					}else if(y < opts.y){
						ty = opts.y;
						vy = (ty-y1)/vector.y;
						tx = x + opts.width - Math.abs(vy*vector.x);
					}

					drawCode += sketchy.drawLineSinglePath({
						svg:svg,
						x1:tx,
						y1:ty,
						x2:x1,
						y2:y1,
						sketch:{
							x:x_dist*opts.sketch,
							y:y_dist*opts.sketch
						}
					});

					y -= y_dist;
				}
			}

			svg.append("path")
			.attr("d", drawCode);

			return svg;
		};

		/**
		* draws a background pattern in the shape of a square according to the position and size of the clip-path object
		* @param {object} opts - object containing the attributes
		* @param {string} opts.clip - id of the clip path
		* @param {float|int} opts.angle - angle of the lines (0-360)
		* @param {float|int} opts.density - distance between lines
		* @param {float|int} opts.sketch - sketchiness factor
		* @param {float|int} opts.margin - extra margin for the background
		* @return {object} svg - d3.selection of a group object, containing the background
		*/



		sketchy.fill = function(opts){
			var merged_opts = extend(defaults, opts);	
			var svg = merged_opts.svg.append("g")
				.attr("clip-path", "url(#"+merged_opts.clip+")");

			//Get the bounding box of the object that wants a background
			var bb = d3.select("#"+merged_opts.clip).node().getBBox();

			//To make sure that the background covers the whole are we increase the background by a few pixels
			merged_opts.x = bb.x-merged_opts.margin;
			merged_opts.y = bb.y-merged_opts.margin;
			merged_opts.width = bb.width + 2*merged_opts.margin;
			merged_opts.height = bb.height + 2*merged_opts.margin;
			merged_opts.svg = svg;

			console.log(merged_opts)

			return sketchy.drawPattern(merged_opts, true);
		};

		/**
		* draws a background pattern in the shape of a square according to the position and size of the clip-path object
		* @param {object} opts - object containing the attributes
		* @param {array} opts.path - array of points {x:float|integer, y:float|integer}
		* @param {int} opts.count - how many altered paths should be generated
		* @param {float|int} opts.sketch - sketchiness factor
		* @return {array} paths - altered paths
		*/


		sketchy.alterPath = function(opts){
			var merged_opts = extend(defaults, opts);
			var paths = [];
			for(var i = 0; i<merged_opts.count; i++){
				var t_path = [];
				for(var j = 0; j<merged_opts.path.length; j++){
					t_path.push({
						x:merged_opts.path[j].x + rand(-1,1)*merged_opts.sketch/(i+1),
						y:merged_opts.path[j].y + rand(-1,1)*merged_opts.sketch/(i+1)
					});
				}
				paths.push(t_path);
			}
			return paths;
		};

		/**
		* Draws alterPath() paths
		* only straight lines, use alterPath and your own drawing function to draw curves etc.
		* @param {object} opts - object containing the attributes
		* @param {array} opts.svg - d3.selection of an svg
		* @param {array} opts.path - array of points {x:float|integer, y:float|integer}
		* @param {int} opts.count - how many altered paths should be generated
		* @param {float|int} opts.sketch - sketchiness factor
		* @return {object} svg - svg with the strokes
		*/
		
		sketchy.pathStroke = function(opts){
			var paths = sketchy.alterPath(opts);
			var svg = opts.svg;

			var drawCode = "";
			for(var i = 0; i<paths.length; i++){
				for(var j = 0; j<paths[i].length; j++){
					var x1 = paths[i][j].x;
					var y1 = paths[i][j].y, x2, y2;
					if(j<(paths[i].length-1)){
						x2 = paths[i][j+1].x;
						y2 = paths[i][j+1].y;
					}else{
						x2 = paths[i][0].x;
						y2 = paths[i][0].y;
					}
					drawCode += sketchy.drawLineSinglePath({
						svg:svg,
						x1:x1,
						y1:y1,
						x2:x2,
						y2:y2,
						sketch:{
							x:opts.sketch,
							y:opts.sketch
						}
					});
				}
			}
			svg.append("path")
			.attr("d", drawCode);
			return svg;
		};

		/**
		* Helper function for circleStroke
		* Adapted from http://codepen.io/spencerthayer/pen/nhjwu
		* Generates an altered circle path
		* @param {float|int} radius - radius of the circle
		* @param {float|int} radius_min - alternating radius min
		* @param {float|int} radius_max - alternating radius max
		* @param {float|int} s_angle_min - alternating angle min
		* @param {float|int} s_angle_max - alternating angle max
		* @param {float|int} rotation_min - alternating rotation min
		* @param {float|int} rotation_max - alternating rotation max
		* @return {string} path - altered circle svg path
		*/
		function circlePath(radius, radius_min,radius_max, s_angle_min, s_angle_max, rotation_min,rotation_max) {
			var c = 0.551915024494,
				b = Math.atan(c),
				d = Math.sqrt(c*c+1*1),
				r = radius,
				o = rand(s_angle_min, s_angle_max)*Math.PI/180,
				path = 'M';

			path += [r * Math.sin(o), r * Math.cos(o)];
			path += ' C' + [d * r * Math.sin(o + b), d * r * Math.cos(o + b)];

			for (var i=0; i<4; i++) {
				o += Math.PI/2 * (1 + rand(rotation_min, rotation_max));
				r *= (1 + rand(radius_min, radius_max));
				path += ' ' + (i?'S':'') + [d * r * Math.sin(o - b), d * r * Math.cos(o - b)];
				path += ' ' + [r * Math.sin(o), r * Math.cos(o)];
			}

			return path;
		}

		/**
		* Helper function for circleStroke
		* Adapted from http://codepen.io/spencerthayer/pen/nhjwu
		* Generates the transform value for squashing and rotating
		* @param {float|int} squash_min - squashing min
		* @param {float|int} squash_max - squashing max
		* @param {float|int} squash_rotation_min - squashing rotation min
		* @param {float|int} squash_rotation_max - squashing rotation max
		* @return {string} path - transform string
		*/
		function circleTransform(squash_min, squash_max, squash_rotation_min, squash_rotation_max) {
			var o = rand(squash_rotation_min, squash_rotation_max);
			return 'rotate('+o+')'+'scale(1,'+rand(squash_min, squash_max) + ')';
		}

		/**
		* Draw a sketch circle stroke
		* Adapted from http://codepen.io/spencerthayer/pen/nhjwu
		* @param {object} opts - object containing the attributes
		* @param {object} opts.svg - svg container
		* @param {float|int} opts.x - center x of circle
		* @param {float|int} opts.y - center y of circle
		* @param {float|int} opts.r - radius of circle
		* @param {int} count - number of strokes
		* @param {float|int} sketch - sketchiness factor
		* @return {object} svg - d3.selection of the svg containing the circles
		*/
		sketchy.circleStroke = function(opts){
			var merged_opts = extend(defaults, opts);
			var svg =  merged_opts.svg.append("g").attr('transform', function() { return "translate("+merged_opts.x+" "+merged_opts.y+") "+circleTransform(1,1, 0,360); });
			var drawCode = "";

			for(var i = 0; i<merged_opts.count; i++){
					drawCode += " " + circlePath(merged_opts.r, merged_opts.sketch/-50/(i+1),merged_opts.sketch/10/(i+1), 200,240, 0,merged_opts.sketch/5/(i+1));
			}

			svg.append('path')
				.attr("class", "sketchy-stroke")
				.attr('d', drawCode);

			return svg;
		};

		/**
		* Draw a sketch rectangle stroke
		* @param {object} opts - object containing the attributes
		* @param {object} opts.svg - svg container
		* @param {float|int} opts.x - x coordinate
		* @param {float|int} opts.y - y coordinate
		* @param {float|int} opts.width - width
		* @param {float|int} opts.height - height
		* @param {int} count - number of strokes
		* @param {float|int} sketch - sketchiness factor
		* @return {object} svg - d3.selection of the svg containing the rectangles
		*/
		sketchy.rectStroke = function(opts){
			var merged_opts = extend(defaults, opts);
			var svg = merged_opts.svg.append("g");
			var path = [
				{x:merged_opts.x, y:merged_opts.y},
				{x:merged_opts.x+merged_opts.width, y:merged_opts.y},
				{x:merged_opts.x+merged_opts.width, y:merged_opts.y+merged_opts.height},
				{x:merged_opts.x, y:merged_opts.y+merged_opts.height}
			];

			return sketchy.pathStroke({svg:svg, path:path, count:merged_opts.count, sketch:merged_opts.sketch});
		};

		return sketchy;
	};



///////////////////////////////////////////////////////
/// SCRIBBLE FILL AN SVG SHAPE (PATH OR PRIMITIVE)  ///
/////////////////////////////////////////////////////// 

  /* Based entirely off Noah Veltmans implementation (https://bl.ocks.org/veltman/985bdca56d122f9525e0abab2ca29c34) of John B. Turners algorithm (https://patents.google.com/patent/US5619633A/en)
     Some some wrapper functions added to:
        - control scribble 'looseness' and control ('uniform to messy').
        - apply scribble fill to an SVG path node
        - call an animation to draw scribble  
  */

      /* Default scribble settings */
        const svgFills = d3.select("svg").append('g').attr('id', 'scribbleFills')
        let scribbleDefaults = {
            "svg"             : svgFills,            // Node of the SVG element
            "segmentDetail"   : 150,                // Sets number of points used in outline polygon (use more for complex shapes)
            "scribbleAngle"   : null,               // Set to Null for random
            "lineFrequency"   : 0.5,              // Sets width between scribble lines
            "lineRandomness"  : 0.5,               // Affects 'messiness'
            "curve"           : d3.curveCardinal.tension(0.5),
            "animationLength" : 2000,
            "fuzzer"          : d3.scaleLinear().domain([0, 300000]).range([5, 25])
          };

      // GENERAL METHOD TO SCRIBBLE FILL PATH: 
        // OutlineNodeID is an ID selector, 
        // Colour can be set programatically but is also defaulted to null to allow for CSS styling
        // Note: scribble fill is set with ID of "outlineNodeID"+"scribbleFill" and class of "scribbleFill"
        // Offset is passed to polygon builder to move the fill within any offset paths (e.g. an offset in adjacent shapes may be specified to avoide overlapping borders)

        function drawScribble(outlineNodeID, animationLength, index, offset, settings = scribbleDefaults, colour){
            let pathNode = document.getElementById(outlineNodeID)                         // select outline node and set as pathNode
            let data  = pathToPolygon(pathNode, settings.segmentDetail, offset, colour)         // create data for scribble fill

			d3.selectAll('.scribbleFill path').remove()
	        svgFills.selectAll(".scribbleFill path")
	            .data(data)                       
	            .enter()
	              .append("path")
	              .attr("id", d => d.id)
	              .attr("class", d => d.class).classed("block", false)
	              .attr("d", d => scribbleFill(d, settings))
	              .style("stroke", d => d.colour)
	              .each(function(d){ 
	              	let delay = index * animationLength;
	              	animateScribble( d3.select(this), animationLength, delay)
	              })
        }; // end drawScribble()


        // HELPER TO MAKE POLYGON DATA OBJECT FROM A PATH: accepts node ID and no. points to model outline
          function pathToPolygon(pathNode, segments, offset, colour){
          	// Adjust fill scribble width for offset
			d3.select(pathNode).attr('x', +d3.select(pathNode).attr('x') + offset)
			d3.select(pathNode).attr('width', +d3.select(pathNode).attr('width') - 2*offset)

            let pathData    = [], coordArray  = [], polygonData = [],  outlinePos = 0,
                pathLen     = pathNode.getTotalLength(),                                    // Total path length
                segmentLen  = pathLen / segments;                                           // Average length between modelled polygon points
        
            // Find coordinates along outline path shape
            for (i = 0; i < segments; i++){
              let xyPos = [ pathNode.getPointAtLength(outlinePos).x  , pathNode.getPointAtLength(outlinePos).y  ]; 
              coordArray.push(xyPos);                                                       // Convert object coordinates to arrays and store in coord array
              outlinePos = outlinePos + segmentLen;                                         // increment segment length
            };

            polygonData.push({
                "coordinates" : [[coordArray]],                                              // Store coordinate array in data object as "coordinates" value
                "colour"      : colour,
                "id"          : d3.select(pathNode).attr('id')+'ScribbleFill',
                "class"       : d3.select(pathNode).attr('class')+' scribbleFill'
            })

            return polygonData;
          }; // end pathToPolygon()

        // HELPER TO ANIMATE SCRIBBLE FILL PATH
          function animateScribble(scribble, duration, delay){
            let scribbleLen = scribble.node().getTotalLength();
      
            scribble
                .attr("stroke-dasharray", scribbleLen + " " + scribbleLen)
                .attr("stroke-dashoffset", scribbleLen)
              .transition().duration(duration).delay(delay)
                .ease(d3.easeCubic)
                .attr("stroke-dashoffset", 0)    
          }; // endAnimateSribble()

        ////////////////////////////////////////////////////////
        // HELPER FUNCTIONS IMPLEMENTING SCRTIBBLE ALGORITHM  //
        ////////////////////////////////////////////////////////

          // RETURNS THE SCRIBBLE FILL PATH ELEMENT FOR GIVEN DATA ARRAY
            function scribbleFill(d, settings){

              // Sets the scribbleAngle
              let scribbleAngle;
              if(settings.scribbleAngle === null){    // Random angle where unspecified
                scribbleAngle = Math.PI * (1 / 16 + Math.random() * 3 / 8) * (Math.random() < 0.5 ? -1 : 1)
              } else { 
                scribbleAngle = settings.scribbleAngle * Math.PI / 180;
              };

              // Sets line frequency and variation based on lineRandomness setting
              let lineFrequency = settings.lineFrequency + Math.random() * settings.lineRandomness,
                  lineVariation = (settings.lineFrequency + Math.random() * settings.lineRandomness) * 3 / 8,
                  spline = d3.line().curve(settings.curve);

                // Construct scribble path 
                return d.coordinates.map(function(d){
                   let fuzzFactor = settings.fuzzer(Math.abs(d3.polygonArea(d[0])));                   // Based on the first element in shape group (assumed 'largest')  
               
                  // Returns a string from scribble function          
                  return scribblePoints(d, scribbleAngle, lineFrequency, lineVariation)
                    .map(line => fuzzPoints(line, fuzzFactor))                   
                    .map(spline)
                    .join(" ");

                }).join(" ");
            }; // end ScribbleFill()

          // RETURNS POINTS FOR CONSTRUCTING SCRIBBLE LINE FROM A ROTATED/RANDOMISED GRID
            function scribblePoints(shapeData, scribbleAngle, lineFrequency, lineVariation) {

              // TODO check intersections against holes - 'donut?'
              let polygon       = shapeData[0],                                                 // Returns the polygon coordinates array(s)
                  midpoint      = getMidpoint(polygon),                                         // Returns center of shape 
                  rotator       = rotateAround(midpoint, scribbleAngle),                        // map function to rotate polygon by scribble angle
                  rotatedShape  = polygon.map(rotator),                                         // Set the polygon to rotated angle
                  gridlines     = getGridlines(rotatedShape, lineFrequency, lineVariation),     // Draw set of pertubred gridlines 
                  intersections = getIntersections(gridlines, rotatedShape);                    // Return intersections of gridlines with shape

              if (intersections.length < 2) { return []; }                                      // Return notning if there's not two points to draw a scribble, 
                
              return getScribbles(intersections, rotatedShape).map(function(scribble){          // Find intesections with grid and return the sribble coordinates 
                return scribble.map(rotateAround(midpoint, -scribbleAngle));                    // Re-rotate the scribble to correct angle
              });
            };

          // FINDS THE COORDINATES TO DRAW THE SCRIBBLE PATH - accepts 
            function getScribbles(rows, rotatedShape) {
              let top = 0,    bottom = 1,    i = j = 0,
                  p1 = rows[top][i],
                  p2 = rows[bottom][j],
                  scribbles = [];

              checkSegment();                                                                 // Adds scribble coordinate arrays subject to check conditions 
              return scribbles;                                                               // Returns sribble coordinates in an array

              // Helper functions to add scribble points
                function checkSegment() {
                  if (isInFront() && isContained()) {
                    addSegment();
                  } else {
                    nextBottom();
                  }
                }; // end checkSegment()

                function addSegment() {
                  let found = scribbles.find(scribble => distanceBetween(scribble[scribble.length - 1], p1) < 1);
                  if (found) {
                    found.push(p2);
                  } else {
                    scribbles.push([p1, p2]);
                  }
                  scribbles.sort((a, b) => scribbleLength(b) - scribbleLength(a));
                  nextTop();
                }; // end addSegment()

                function isInFront() {
                  return (top % 2 ? -1 : 1) * (p2[0] - p1[0]) > 0
                }

                function isContained() {
                  if (p1[2] === p2[2] || !d3.polygonContains(rotatedShape, pointBetween(p1, p2, 0.5))) {
                    return false;
                  }

                  return rotatedShape.every(function(a, segmentIndex){
                    const b = rotatedShape[segmentIndex + 1] || rotatedShape[0];
                    return segmentIndex === p1[2] || segmentIndex === p2[2] || !segmentsIntersect([a, b], [p1, p2]);
                  });
                }

                function nextRow() {
                  if (bottom + 1 < rows.length) {
                    p1 = rows[++top][i = 0];
                    p2 = rows[++bottom][j = 0];
                    checkSegment();
                  }
                }

                function nextTop() {
                  if (i + 1 >= rows[top].length) {
                    nextRow();
                  } else {
                    p1 = rows[top][++i];
                    checkSegment();
                  }
                }

                function nextBottom() {
                  if (j + 1 >= rows[bottom].length) {
                    nextTop();
                  } else {
                    p2 = rows[bottom][++j];
                    checkSegment();
                  }
                }

                function scribbleLength(points) {
                  return points.reduce(function(length, point, i){
                    return i ? length + distanceBetween(point, points[i - 1]) : 0;
                  }, 0);
                }
            };

          // MODIFIES THE SCRIBBLE POINTS WITH FUZZFACTOR
            function fuzzPoints(polyline, magnitude) {
              return polyline.map(function(point, i){
                if (i === 0 || i === polyline.length - 1) {
                  return point;
                }
                return moveAlongBisector(polyline[i - 1], point, polyline[i + 1], Math.random() * magnitude);
              });
            }; // end fuzzPoints()

          // CREATE GRIDLINES FOR FINDING POINTS
            function getGridlines(points, lineFrequency, lineVariation) {                    // Takes the points of the rotated outlined shape and creates a grid
              let bounds = getBounds(points),                                                     // gives array of top right and bottom left points
                  i = bounds[0][1],                                                               // gives X position at 'top' as starting point to draw gridline
                  gridY = [],                                                                     // Array to hold Y coordinates of grid, alter mapped to coordinates
                  space = lineFrequency - lineVariation / 2 + Math.random() * lineVariation;      // declartion and spacing for first line (rest handled in loop)

              while (i + space < bounds[1][1]) {                                                  // Loop to fill gridY with random spacing wtithin bounds
                i += space;
                gridY.push(i);
                space = lineFrequency - lineVariation + Math.random() * lineVariation * 2;
              };

              return gridY.map(y => [[bounds[0][0] - 5, y], [bounds[1][0] + 5, y]]);            // An array of coordinates for gridlines, slightly outsline the bounds
            }; // end getGridlines()

          // FIND INTERSECTIONS OF GRIDLINE AND ROTATED SHAPE
            function getIntersections(gridlines, rotatedShape){
              return gridlines.map(function(gridline, i){
                const y = gridline[0][1],
                      row = [],
                      direction = i % 2 ? - 1 : 1;

                rotatedShape.forEach(function(p1, j){
                  const p2 = rotatedShape[j + 1] || rotatedShape[0],
                        m = (p2[1] - p1[1]) / (p2[0] - p1[0]),
                        b = p2[1] - m * p2[0],
                        x = (y - b) / m;

                  if ((p1[1] <= y && p2[1] > y) || (p1[1] >= y && p2[1] < y)) {
                    row.push([x, y, j]);
                  }
                });

                row.sort((a, b) => direction * (a[0] - b[0]));
                return row;
              });
            }; // end getIntersections()

          // HELPER FUNCTIONS FOR GEOMETRY CALCS
            // ROTATION FUNCTION
            function rotateAround(center, angle) {
              const cos = Math.cos(angle),
                    sin = Math.sin(angle);

              return function(p) {
                return [
                  center[0] + (p[0] - center[0]) * cos - (p[1] - center[1]) * sin,
                  center[1] + (p[0] - center[0]) * sin + (p[1] - center[1]) * cos
                ];
              };
            }; // end rotateAround()

            // GETS BOUNDARY POINTS OF ROTATED SHAPE (top left and bottom right) TO APPLY GUIDING GRID
            function getBounds(rotatedShape) {
              let x0 = y0 = Infinity,                 // Not sure of the purpose of these tests: some boudnary condition/case?
                  x1 = y1 = -Infinity;

              rotatedShape.forEach(function(point){
                if (point[0] < x0) x0 = point[0];
                if (point[0] > x1) x1 = point[0];
                if (point[1] < y0) y0 = point[1];
                if (point[1] > y1) y1 = point[1];
              });

              return [ [x0, y0],    [x1, y1] ];
            }; // end getBounds()

            // GETS MIDPOINT OF SHAPE TO ALLOW ROTATION
            function getMidpoint(rotatedShape) {
              const bounds = getBounds(rotatedShape);

              return [
                (bounds[1][0] + bounds[0][0]) / 2,
                (bounds[1][1] + bounds[0][1]) / 2
              ];
            }; // end getMidpoint()

            function segmentsIntersect(a, b) {
              if (orientation(a[0], a[1], b[0]) === orientation(a[0], a[1], b[1])) {
                return false;
              };
              return orientation(b[0], b[1], a[0]) !== orientation(b[0], b[1], a[1]);
            }; //end segmentIntersect()

            function orientation(p, q, r) {
              const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
              return val > 0 ? 1 : val < 0 ? -1 : 0;
            }; // end orientation()

            function pointBetween(a, b, pct) {
              const point = [
                a[0] + (b[0] - a[0]) * pct,
                a[1] + (b[1] - a[1]) * pct
              ];

              return point;
            }; // end pointBetween()

            function distanceBetween(a, b) {
              const dx = a[0] - b[0],
                    dy = a[1] - b[1];

              return Math.sqrt(dx * dx + dy * dy);
            }; // end distanceBetween()

            function moveAlongBisector(start, vertex, end, amount) {

              let at = getAngle(start, vertex),
                  bt = getAngle(vertex, end),
                  adjusted = bt - at,
                  angle;

              if (adjusted <= -Math.PI) {
                adjusted = 2 * Math.PI + adjusted;
              } else if (adjusted > Math.PI) {
                adjusted = adjusted - 2 * Math.PI;
              };

              angle = (adjusted - Math.PI) / 2 + at + (Math.random() < 0.5 ? Math.PI : 0);

              return [
                vertex[0] + amount * Math.cos(angle) / 2,
                vertex[1] + amount * Math.sin(angle) / 2
              ];
            }; // end moveAlongBisector()

            function getAngle(a, b) {
              return Math.atan2(b[1] - a[1], b[0] - a[0]);
            }; // get endAngle()



////////////////////////////////
/// SHAPE TO PATH SCRIBBLER   //
////////////////////////////////

	// Function to take a Rect and 
	function rectToPath(rectID, offset, wobblePct) {

		// Use bounding box to get rectangle dimensions
		let rect = document.getElementById(rectID), rectBB= rect.getBBox();

		let	 x0 = rectBB.x + offset,		y0 = rectBB.y + offset*0,				// Starting coordinates
			dx1 = 0,			 			dy1 = rectBB.height - (2*offset*0),	// Relative movement to next point
			dx2 = rectBB.width-(2*offset),	dy2 = 0,							// Relative movement to next point
			dx3 = 0,			 			dy3 = -rectBB.height + (2*offset*0),	// Relative movement to next point
			dx4 = -rectBB.width+(2*offset), dy4 = 0;							// Relative movement to next point


		let vertWobbleLimit = wobblePct/100 * rectBB.height,
		 	horiWobbleLimit = wobblePct/100 * rectBB.width,
			vertWobble1 = (Math.random()*2-1) * vertWobbleLimit, 
		 	vertWobble2 = (Math.random()*2-1) * vertWobbleLimit,
		 	vertWobble3 = (Math.random()*2-1) * vertWobbleLimit,
		 	vertWobble4 = (Math.random()*2-1) * vertWobbleLimit,
		 	horiWobble1 = (Math.random()*2-1) * horiWobbleLimit/2,
		 	horiWobble2 = (Math.random()*2-1) * horiWobbleLimit/2;


		let wobbleRectPath = 'm'+x0 +','+y0 +' c'+vertWobble1+','+dy1*1/3+' '+ vertWobble2 +','+ dy1*2/3 +' '		// Starting point and bezier handles
								+dx1+','+dy1+'  '+dx2*1/3+','+horiWobble1+' '+ dx2*2/3 +','+ horiWobble2 +' '	// Next point and bezier handles
								+dx2+','+dy2+'  '+vertWobble3+','+dy3*1/3+' '+ vertWobble4 +','+ dy3*2/3 +' '	
								+dx3+','+dy3+'  '+dx3*1/3+','+horiWobble1+' '+ dx3*2/3 +','+ horiWobble2 +' '
								+dx4+','+dy4;

	    return wobbleRectPath							
	}; // rectToPath*()






