///////////////////////////////////////////////////////////////////	
//  ZNET Postcards      				      					 //
//  version: 0.1												 //
//  Created by Little Sketcches for the ZNET Hepburn project     //
//	
//  Provided (without support) under CCv3.0 Attribution license	  //
////////////////////////////////////////////////////////////////////	


//////////////////////////
/// Setup page onload ////
//////////////////////////
		

	window.addEventListener('DOMContentLoaded', init)                       // Load project data from google sheet: using tabletop 
	function init(){  	
		d3.selectAll('.option-postcard, .context-postcard').style('opacity', 0)
	  	var public_spreadsheet_url = "https://docs.google.com/spreadsheets/d/1taqCHtNTnr0tNUhH8pavSHkrg7zKSEqqyQflszQDLpw/edit?usp=sharing";
	  	// Tabletop.init({ 
	   //    	key: public_spreadsheet_url,
	   //    	callback: renderVis,
	   //    	simpleSheet: true
	   //  });


		d3.tsv("data/data.txt", function(error, data) {
		  renderVis(data)
		});

	};


//////////////////////////////////////////
///                        ///
//////////////////////////////////////////

	// Declare global variables for storing data and series/key names
	var options = [],
		optionNames = [],
		optionGroups = [],
		textIDs = [],
		contexts = [],
		contextNames = [],
		contextGroups = []

	// Variables for vis: Define scales with ranges based on SVG dimensions for x, y and series colour scale
	var svg, 
		desirabilityRating = 0, 
		feasibilityRating = 0,
		viabilityRating = 0

	var contextIDs = ["context-energy", "context-electricity"]

/////////////////////////////////////  
// RENDER VIS: with starting view  //
/////////////////////////////////////

	// Note: renderVis is set as the callback after data is loaded: it 
	function renderVis(data, tabletop){		
		// Wrangle data
		createContexts(data);						// Create lists of context card names and categories	
		createOptions(data);						// Create lists of option names and categories
		createIDs(data)								// Creater list of iDs for referrencing/importing text elemetns	
		parseData(data);							// Parse translation data for contribution stamp
		masterData = data;       					// Pass data to global variable (for testing)


		// Create the dropdown list
		createDropdown(data)						// Build sthe dropdown list and adds event listener fo channig


		// Set starting card
		document.getElementById("postcard-selector").value = 'Energy use in Hepburn Shire'
		changeContext(data, 'context-1')				
	
	}; // end renderVis()


	//////////////////////  
	// HELPER FUNCTIONS //
	//////////////////////

		var noContext = 2		// Number of context postcards

		// Parse data (for tcontribution translation)
		function parseData(data){
			var contributionTransIndex = returnIndex('contribution-translation', data);	
			for(i = 0; i < options.length ; i++) {
				data[contributionTransIndex][options[i]] = +data[contributionTransIndex][options[i]];
			};
		};


		// Create the options (abatement)
		function createOptions(data){
			var optionIndex = returnIndex('mainTitle', data)
			var optionGroupIndex = returnIndex('subTitle', data)

			for (i = 1; i < Object.keys(data[0]).length - noContext; i ++){
				options.push('option-'+i)
				optionNames.push(data[optionIndex]['option-'+i])
				optionGroups.push(data[optionGroupIndex]['option-'+i])
			};
		};

		// Create the context options
		function createContexts(data){
			var contextIndex = returnIndex('mainTitle', data)
			var contextGroupIndex = returnIndex('subTitle', data)

			for (i = 1; i < noContext + 1; i ++){
				contexts.push('context-'+i)
				contextNames.push(data[contextIndex]['context-'+i])
				contextGroups.push(data[contextGroupIndex]['context-'+i])
			};
		};

		function createIDs(data){
			for (i = 0; i < data.length; i ++){
				textIDs.push(data[i]['id'])
			};
		};

		// Find index of data for given id
		function returnIndex(id, data) {
			for (i = 0; i < data.length; i ++){
				if(data[i]['id'] === id){return i};
			};
		};

		// Change option card
		function changeCard(data, option){
			d3.selectAll('.option-postcard')
				.transition().duration(250)
				.style('opacity', 1)

			d3.selectAll('.context-postcard')
				.transition().duration(250)
				.style('opacity', 0)


			// Update all text by ID
			d3.selectAll('.text').transition().duration(250).style('opacity',0)

			setTimeout(function(){ changeAll()}, 300)

			function changeAll(){
				for(i = 0; i < textIDs.length; i++){
					var index = returnIndex(textIDs[i], data)		
					var content = data[index][option]
					d3.select('#'+textIDs[i]).html(content).transition().duration(1250).style('opacity',1)
				};	

				// Show drawing
				var drawIndex = returnIndex('drawing', data)	
				var drawID = '#'+data[drawIndex][option]
				d3.selectAll('.drawing-group').style('display', 'none')
				d3.select(drawID).style('display', 'inline')

				var drawElementNo = d3.select(drawID).node().childElementCount;
				var selectedElements = [];
				// Animate drawing
				for(i = 0; i < drawElementNo; i++){
					var index = (i * 2) + 1,
					 	pathNo = i+1,
						path = d3.select(drawID+'>path:nth-of-type('+pathNo	+')'),
					 	pathLength = d3.select(drawID).node().childNodes[index].getTotalLength()

					path.style("stroke-dasharray", pathLength + " " + pathLength)
						.style("stroke-dashoffset", pathLength)
						.transition().duration(2500)
						.style("stroke-dashoffset", 0);
				}; 				

				// Show ratings
				d3.selectAll('.circle-fill').style('display', 'none')
				var desirabilityIndex = returnIndex('desirability-rating', data)	
				var desirabilityRating = +data[desirabilityIndex][option]
		
				var feasibilityIndex = returnIndex('feasibility-rating', data)	
				var feasibilityRating = +data[feasibilityIndex][option]

				var viabilityIndex = returnIndex('viability-rating', data)	
				var viabilityRating = +data[viabilityIndex][option]

				renderRatings(desirabilityRating, feasibilityRating, viabilityRating);

				// Move stamp
				var contributionIndex = returnIndex('contribution-translation', data)	
				var contributionX = data[contributionIndex][option];
				var contributionPctIndex = returnIndex('contribution-pctTranslation', data)
				var contributionPctX = data[contributionPctIndex][option];

				d3.select('#contribution-pct').attr('x', contributionPctX)
				d3.select('#contribution-group').attr('transform', 'translate('+contributionX+', 0)')



			};
		};



		function renderRatings(desirabilityRating, feasibilityRating, viabilityRating){

			var pathLength = d3.select('#des-fill-01').node().getTotalLength()

			if(desirabilityRating === 1){
				d3.select('#des-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)
			} else if (desirabilityRating === 2){
				d3.select('#des-fill-01').style('display', 'inline')	
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)							
				d3.select('#des-fill-02').style('display', 'inline')		
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(1000).duration(1000)
						.style("stroke-dashoffset", 0)						
			} else if (desirabilityRating === 3){
				d3.select('#des-fill-01').style('display', 'inline')	
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)							
				d3.select('#des-fill-02').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(1000).duration(1000)
						.style("stroke-dashoffset", 0)								
				d3.select('#des-fill-03').style('display', 'inline')				
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(2000).duration(1000)
						.style("stroke-dashoffset", 0)
			}

			if(feasibilityRating === 1){
				d3.select('#fea-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)
			} else if (feasibilityRating === 2){
				d3.select('#fea-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)								
				d3.select('#fea-fill-02').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(1000).duration(1000)
						.style("stroke-dashoffset", 0)								
			} else if (feasibilityRating === 3){
				d3.select('#fea-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)								
				d3.select('#fea-fill-02').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(1000).duration(1000)
						.style("stroke-dashoffset", 0)								
				d3.select('#fea-fill-03').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(2000).duration(1000)
						.style("stroke-dashoffset", 0)								
			}

			if(viabilityRating === 1){
				d3.select('#via-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)
			} else if (viabilityRating === 2){
				d3.select('#via-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)								
				d3.select('#via-fill-02').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(1000).duration(1000)
						.style("stroke-dashoffset", 0)										
			} else if (viabilityRating === 3){
				d3.select('#via-fill-01').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().duration(1000)
						.style("stroke-dashoffset", 0)								
				d3.select('#via-fill-02').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(1000).duration(1000)
						.style("stroke-dashoffset", 0)										
				d3.select('#via-fill-03').style('display', 'inline')
					.style("stroke-dasharray", pathLength + " " + pathLength)
					.style("stroke-dashoffset", pathLength)
					.transition().delay(2000).duration(1000)
						.style("stroke-dashoffset", 0)										
			}
		};		

		// Change context
		function changeContext(data, option){
			d3.selectAll('.option-postcard')
				.transition().duration(250)
				.style('opacity', 0)

			d3.selectAll('.context-postcard')
				.transition().duration(0)
				.style('opacity', 0)

			var contextNameSelected = document.getElementById("postcard-selector").value; 
			var	indexSelected  = contextNames.indexOf(contextNameSelected); 
			var contextSelected = contexts[indexSelected];
			var contextID = contextIDs[indexSelected];


			// Update all text by ID

			for(i = 0; i < textIDs.length; i++){
				var index = returnIndex(textIDs[i], data)		
				var content = data[index][option]
				d3.select('#'+textIDs[i]).html(content).transition().duration(1250).style('opacity',1)
			};	
	
			d3.selectAll('#context-base, #'+contextID)
				.transition().duration(250)
				.style('opacity', 1)
		};


		// General function to populate the dropdown and add event listener
	    function populateDropdown(data, element, array){

	    	// Add all the abatement options
			for (var i = 0; i < array.length; i++){   
				d3.select('#'+element)
				  .append('option').attr('value', array[i])
				  .html(array[i]);  
			};
	    };

	    function addDropdownListener(data){
	    	d3.select('#postcard-selector')
				.on('change', function(){
					var optionNameSelected = document.getElementById("postcard-selector").value; 
					var indexSelected  = optionNames.indexOf(optionNameSelected); 
					var optionSelected = options[indexSelected];

					if(indexSelected > -1){
						changeCard(data, optionSelected)		// Change for an option card
					} else {
					 	indexSelected  = contextNames.indexOf(optionNameSelected); 
					 	optionSelected = contexts[indexSelected];
						changeContext(data, optionSelected)		// Change for a context card
					}
				})
	    };

	    function createDropdown(data){
	    	d3.select('#postcard-selector').append('option').attr('disabled','').html('---- Emissions context -----'	);  
			populateDropdown(data, 'postcard-selector', contextNames)
			d3.select('#postcard-selector').append('option').attr('disabled','').html('---- Emissions reduction options -----'	);  
			populateDropdown(data, 'postcard-selector', optionNames)
			addDropdownListener(data)
	    };


