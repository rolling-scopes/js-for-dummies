'use strict';


var options = {
	cachingPages : 0,		//count of pages from end, when new elements will be loaded
	pagingChangeOn : 10,	//number of pages, when paging will changed 
	elemsInResponse : {
		count: 1,	//how many items loads in one request
		inPages: true
	},
	timeout: 10000,			
	qScrollzoom : 0.5,		//quick scroll zoom
	qScrollspeed : 4,		//quick scroll max distance in pages
	thumbSize : 0			//0 - big, 2 - small
};

(function (options){
	var thumbSize, cachingPages, windowWidth, fastSlide, maxResults, pagesBeforeCollapse, elemWidth, elemsOnPage, pagesCount = 1, currentPage = 0, elemLeft, activePage, lastSearch, req, style, dom, margin;
	thumbSize = options.thumbSize || 0;
	cachingPages = options.cachingPages || 0;
	fastSlide = {};
	fastSlide = {
		zoom: options.qScrollzoom || 0.5,
		speedInPages: options.qScrollspeed || 4,	//x*fastSlide.zoom will slide x pages maximum
		speed: function () {
			return fastSlide.speedInPages*fastSlide.zoom;
		}
	};
	maxResults = {
		count: options.elemsInResponse.count || 4,
		inPages: options.elemsInResponse.inPages || false,
		countElems: function(){
			return maxResults.inPages ? maxResults.count*elemsOnPage : maxResults.count;
		}
	};
	pagesBeforeCollapse = options.pagingChangeOn || 1;
	activePage = {
		n: currentPage
	};
	lastSearch = {
		stroke : '',
		start : 1
	};
	req = new XMLHttpRequest();
	style = {};
	dom = {
		settings : {}
	};

	req.timeout = options.timeout || 10000;
	req.ontimeout = function(){
		alert('Time out');
	}
	req.onreadystatechange = function(){
		if (this.readyState == 4) {
			dom.loader.style.opacity = 0;
		
		
		
			setTimeout(function () {
				dom.loader.style.webkitAnimationName = '';
			
			
			
			}, 500);
			if(this.status == 200) {
				var response = JSON.parse(this.responseText);
				createCliplist(response);
				changeSliderWidth();
				remakePaging();
				lastSearch.start += maxResults.countElems();
			}
		}
	};

	function createCliplist(rawYouTubeData) {
		var clipList = [];
		var entries = rawYouTubeData.feed.entry;
		if (entries) {
			dom.slider.removeChild(dom.pusher);
			for (var i = 0, l = entries.length; i < l; i++){
				var entry = entries[i];

				var date = new Date(Date.parse(entry.updated.$t));
				var shortId = entry.id.$t.match(/videos\/(.*)/)[1];
				clipList.push({
					id: shortId,
					youtubeLink: "http://www.youtube.com/watch?v=" + shortId,
					title: entry.title.$t,
					thumbnail: entry.media$group.media$thumbnail[thumbSize].url,
					description: entry.media$group.media$description.$t,
					author: entry.author[0].name.$t,
					publishDate: date.getDate() + '.' + (1+date.getMonth()) + '.' + date.getFullYear(),
					views: entry.yt$statistics ? entry.yt$statistics.viewCount : ''	//it's for request "cats"? for example
				});


				var elemProps = clipList[i];

				var elem = document.createElement('li');

				var elemTitle = document.createElement('h1');
				var elemThumb = document.createElement('img');

				var elemAuthor = document.createElement('span');
				var elemDate = document.createElement('span');
				var elemViews = document.createElement('span');

				var elemLink = document.createElement('a');
				var elemDescription = document.createElement('p');
				var elemInfo = document.createElement('div');

				elemLink.className = 'image';
			
				elemDescription.innerHTML = elemProps.description;
				elemInfo.className = 'info';
				elemLink.setAttribute('href', elemProps.youtubeLink);
				elemThumb.setAttribute('src', elemProps.thumbnail);
				elemThumb.setAttribute('alt', 'Preview');
				elemTitle.innerHTML = elemProps.title;

				elemAuthor.className = 'author';
				elemAuthor.innerHTML = elemProps.author;
				elemDate.className = 'date';
				elemDate.innerHTML = elemProps.publishDate;
				elemViews.className = 'views';
				elemViews.innerHTML = elemProps.views;

				elemLink.appendChild(elemThumb);
				elemLink.appendChild(elemTitle);

				elemInfo.appendChild(elemAuthor);
				elemInfo.appendChild(elemDate);
				elemInfo.appendChild(elemViews);

				elem.appendChild(elemLink);
				elem.appendChild(elemDescription);
				elem.appendChild(elemInfo);
			

				dom.slider.appendChild(elem);


				elemLink.addEventListener( 'click', function(k){
					return function (r) {
						event.preventDefault();
						showModal(k);
						return false;
					}
				}(elemProps.id));


			}
			styleSet('#elements li', {
				'width' : elemWidth + 'px'
			});
			dom.slider.appendChild(dom.pusher);
			dom.slider.appendChild(activePage.node);
		
		
		}
	}




	function getElems(searchStroke) {
	
	
		if ((lastSearch.startBefore == lastSearch.start) && (lastSearch.stroke == searchStroke)) return;


		dom.loader.style.opacity = 1;
		dom.loader.style.webkitAnimationName = 'rotate';
	
	
	
	


		req.open("get", "http://gdata.youtube.com/feeds/api/videos?start-index="+lastSearch.start+"&max-results="+maxResults.countElems()+"&alt=json&q="+searchStroke, true);
		req.send(null);


		lastSearch.stroke = searchStroke;
		lastSearch.startBefore = lastSearch.start;
	}


	function showModal(key) {

		if (key=='settings') {
			dom.modal.appendChild(dom.settings.block);
		} else {
			var video = document.createElement('iframe');

			video.id = 'player';
			video.setAttribute('type', 'text/html');
			video.setAttribute('width', '800');
			video.setAttribute('height', '480');
			video.setAttribute('src', 'http://www.youtube.com/embed/'+key+'?enablejsapi=1&origin=http://example.com');
			video.setAttribute('frameborder', '0');

			dom.modal.appendChild(video);
		}
		dom.modal.style.display = 'block';
	}



	function changeElemWidth(){
		elemsOnPage = Math.floor(windowWidth / 300) || elemsOnPage || 1;
		elemWidth = (windowWidth - elemsOnPage*20) / elemsOnPage;
	
		styleSet('#elements li', {
			'width' : elemWidth + 'px'
		});
	}

	function changeSliderWidth() {
		var width = dom.elems.length * (elemWidth + 20);
		pagesCount = Math.ceil( width / windowWidth );
	
		styleSet('#'+dom.slider.id, {
			'width' : (pagesCount*windowWidth) + 'px'
		});

	}


	function toPage (pageN) {

		if(document.getElementById('currentPage')) document.getElementById('currentPage').id = '';
		if (pageN > pagesCount-2-cachingPages) {
			getElems(lastSearch.stroke);
		}
		if (pageN != currentPage) window.getSelection().removeAllRanges(); 
		if (pageN > pagesCount-1){
			currentPage = pagesCount-1;
		}
		else if (pageN < 0) currentPage = 0;
		else currentPage = pageN;

		dom.slider.style.left = -(currentPage * windowWidth) + 'px';
	
	
	


		elemLeft = dom.elems[currentPage*elemsOnPage] || dom.elems[0];
		dom.paging.children[currentPage].id  = 'currentPage';
	}


	function getPageOnPosition(pos) {
		elemLeft = elemLeft || dom.slider.children[currentPage*elemsOnPage] || dom.elems[0];
		var position = pos || elemLeft.offsetLeft;
		return Math.floor(position / windowWidth);
	}



	function remakePaging () {
		while(dom.paging.hasChildNodes()){
			dom.paging.removeChild(dom.paging.firstChild);
		}


		for (var i = 0; i < pagesCount; i++) {
			dom.paging.appendChild(function(x){

				var newLi = document.createElement('li');
				if (x == currentPage) newLi.id = 'currentPage';
				newLi.addEventListener( 'click', function (y){
					return function () {
						event.preventDefault();
						window.getSelection().removeAllRanges();
						toPage(y);
						return false;
					};
				}(x), true);
				//if (pagesCount <= pagesBeforeCollapse){
					newLi.innerHTML = /*(i+1) + ': ' +*/ (i*elemsOnPage+1);
				//}

				return newLi;
			}(i));
		}

		if (pagesCount > pagesBeforeCollapse){
			dom.paging.className = 'many-pages';

		} else {
			dom.paging.className = '';
		}

		style['#nav li'] = {
			'width' : 'calc(100% / ' +  pagesCount + ' - .4rem)'
		};
		style['#nav.many-pages li'] = {
			'width' : 'calc(100% / ' +  pagesCount + ')'
		};
		style['#nav.many-pages:hover li'] = {
			'width' : 'calc('+(100-100/pagesBeforeCollapse)+'% / ' + (pagesCount-1) + ')'
		}
		style['#nav.many-pages li:hover'] = {
			'width' : (100/pagesBeforeCollapse)+'%'
		}
		style['#nav.many-pages li:last-child'] = {
			'float' : 'none',
			'width' : 'auto'
		}
		applyStyles();
	}

function styleSet (selector, properties) {
	var styleTemp;
 	if ( style.hasOwnProperty(selector) ) {
 		for (var property in properties) { style[selector][property] = properties[property]; }
 	} else {
 		style[selector] = properties;
 	}
 	applyStyles();
}

	function createBehavior() {

		var mouseProps = {};
		var mouseDownOn;


		dom.slider.addEventListener('mousedown', function (e) {
			if(!e.ctrlKey){
				event.preventDefault();
				window.getSelection().removeAllRanges();
				mouseDownOn = 'slider';
				mouseProps.posX = e.pageX;
				return false;
			}
		});
		dom.footer.addEventListener('mousedown', function (e) {
			if(!e.ctrlKey){
				event.preventDefault();
				window.getSelection().removeAllRanges();
				mouseDownOn = 'footer';
				mouseProps.posX = e.pageX;
				mouseProps.sliderOffset = dom.slider.offsetLeft;
				return false;
			}
		});
		dom.search.addEventListener('mousedown', function (e) {
			mouseDownOn = 'search';
		})
		dom.modal.addEventListener('mousedown', function (e) {
			mouseDownOn = 'search';
		})

		document.addEventListener('mousemove', function (e) {
			if(e.which) {
				if((!e.ctrlKey) && (mouseDownOn!='search') && (mouseDownOn!='modal')) {
					event.preventDefault();
					window.getSelection().removeAllRanges();
					switch (mouseDownOn) {
						case 'slider': {
							dom.slider.style.transition = 'none';
						
						
						
							var mouseOffset = mouseProps.posX - e.pageX;
							if (Math.abs(mouseOffset) < 100){
								dom.slider.style.left = (-(currentPage * windowWidth) - mouseOffset) + 'px';
							
							
							
							}
						} break
						case 'footer': {
							style['.border:before'] = {
								'right' : (1+(fastSlide.zoom-0))*50 + '%'
							}
							style['.border:after'] = {
								'left' : (1+(fastSlide.zoom-0))*50 + '%'
							}
							applyStyles();
							mouseProps.isFooterSlide = true;
							activePage.node.className = 'active-page';
						
							styleSet('.active-page', {
								'width' : windowWidth + 'px'
							});

							var mouseOffset = mouseProps.posX - e.pageX;
							//console.log(fastSlide.speed());
							activePage.n = Math.round(mouseOffset*fastSlide.speed()/(windowWidth*fastSlide.zoom)) + currentPage;
							if (activePage.n < 0) activePage.n = 0;
							else if (activePage.n > pagesCount-1) activePage.n = pagesCount-1;
							activePage.node.style.left = (activePage.n * windowWidth) + 'px';

							document.body.className = 'border';
							dom.slider.style.transition = 'none';
							dom.slider.style.webkitTransform = 'scale('+fastSlide.zoom+')';
							dom.slider.style.left = (-(currentPage * windowWidth) - mouseOffset*fastSlide.speed() + ((windowWidth-dom.slider.clientWidth)/2 - mouseProps.sliderOffset)*(1-fastSlide.zoom)) + 'px';
						
						
						
						
						
						} 
					}
					return false;
				}
			}
		});

		document.addEventListener('mouseup', function (e) {
			if((!e.ctrlKey) && (mouseDownOn!='search') && (mouseDownOn!='modal')){
				event.preventDefault();
				window.getSelection().removeAllRanges();
				switch (mouseDownOn) {
					case 'slider': {
						dom.slider.style.transition = '';
					
					
					

						mouseProps.posX -= e.pageX;
						if (mouseProps.posX > 100)
							toPage(++currentPage);
						else if (mouseProps.posX < -100)
							toPage(--currentPage);
						else
							toPage(currentPage);
					} break
					case 'footer': {
						if(mouseProps.isFooterSlide){
							activePage.node.className = '';
							document.body.className = '';
							dom.slider.style.transition = '';
							dom.slider.style.webkitTransform = '';
						
						
						
						
							toPage(activePage.n);
							mouseProps.isFooterSlide=false;
						}
					} 
				}
				mouseDownOn = '';
				return false;
			}
		});

		document.addEventListener('keydown', function (e){
			if (e.target != this.getElementById('search')){
				if (e.keyCode==39) toPage(++currentPage);
				else if (e.keyCode==37) toPage(--currentPage);
			}
		});

		dom.searchForm.addEventListener('submit', function (e){
			event.preventDefault();
			if (document.getElementById('search').value != lastSearch.stroke) {
				while(dom.slider.hasChildNodes()){
					dom.slider.removeChild(dom.slider.firstChild);
				}
				dom.slider.appendChild(dom.pusher);
				dom.slider.appendChild(activePage.node);
				lastSearch.start = 1;
				getElems(document.getElementById('search').value);

				toPage(0);
			}
			return false;
		});



		dom.pusher.addEventListener('click', function(){
			getElems(lastSearch.stroke);
		
		});

		dom.opt.addEventListener('submit', function (e){
			e.preventDefault();
			cachingPages = this.elements[0].value;
			pagesBeforeCollapse = this.elements[1].value;
			maxResults.count = this.elements[2].value;
			maxResults.inPages = this.elements[3].checked;
			fastSlide.zoom = this.elements[4].value;
			fastSlide.speedInPages = this.elements[5].value;
			thumbSize = this.elements[6].value;
			return false;
		});



	}


	function applyStyles() {
		var styleString = '';
		for (var p in style){
			styleString += '\n' + p + ' {\n';
				for (var s in style[p]) {
					styleString += '\t' + s + ': ' + style[p][s] + ';\n';
				}
			styleString += ' }';
		}
		styleString += '\n';
		dom.style.innerHTML = styleString;
	}




	function createDom() {

		dom.style = document.createElement('style');
		document.getElementsByTagName('head')[0].appendChild(dom.style);

		dom.header = document.createElement('header');
		dom.footer = document.createElement('footer');
		dom.slider = document.createElement('ul');
		dom.slider.id = 'elements';
		dom.elems = dom.slider.getElementsByTagName('li');

		dom.paging = document.createElement('ul');
		dom.paging.id = 'nav';
		dom.pages = dom.paging.getElementsByTagName('li');

		dom.searchForm = document.createElement('form');
		dom.searchForm.id = 'searchForm';

		dom.search = document.createElement('input');
		dom.search.id = 'search';
		dom.search.setAttribute('type','search');
		dom.search.setAttribute('placeholder','Search on Youtube')


		document.body.appendChild(dom.header);
		document.body.appendChild(dom.slider);
		document.body.appendChild(dom.footer);

		dom.footer.appendChild(dom.paging);
		dom.header.appendChild(dom.searchForm);
		dom.searchForm.appendChild(dom.search);


		dom.pusher = document.createElement('li');
		dom.pusher.id = 'getMore';
		dom.slider.appendChild(dom.pusher);

		dom.loader = document.createElement('li');
		dom.loader.id = 'loader';
		dom.header.appendChild(dom.loader);

		activePage.node = document.createElement('div');
		dom.slider.appendChild(activePage.node);

		dom.modal = document.createElement('div');
		dom.modal.className = 'modal';
		dom.modal.addEventListener( 'click', function (e) {
			if (e.target == dom.modal){
				this.style.display = 'none';
			
			
			
				while(this.hasChildNodes()){
					this.removeChild(this.firstChild);
				}
			}
		});
		document.body.appendChild(dom.modal);

		dom.settings.button = document.createElement('div');
		dom.settings.button.className = 'settings';
		dom.settings.button.innerHTML = 'Info';
		dom.settings.button.addEventListener( 'click', function(){
			showModal('settings');
		});
		dom.header.appendChild(dom.settings.button);

		dom.settings.block = document.createElement('div');
		dom.settings.block.className = 'settings-block';
		dom.opt = document.createElement('form');
		dom.settings.block.appendChild(dom.opt);
		/*it's not ok, but it is works*/
		dom.opt.innerHTML = '<ul><li>slide on main block</li><li>quick slide on page block</li><li>arrows for navigate</li><li>ctrl+mouse for selection</li><li>I know, this modal window is very bad, not enough time</li><li>in future: cookies, favourites</li></ul><label>Caching pages: <input type="number" value="'+ cachingPages +'"></label><br><label>Paging change on <input type="number" min="10" value="'+ pagesBeforeCollapse +'"> page</label><br><label>Elements in response: <input type="number" min="1" max="10" value="'+ maxResults.count +'"></label> <label>in pages <input type="checkbox" '+ (function(){if(maxResults.inPages) return 'checked'})() +'></label><br><label>Quick scroll zoom: <input type="range" min="0.1" max="0.9" step="0.1" value="'+ fastSlide.zoom +'"></label><br><label>Quick scroll speed: <input type="number" min="1" value="'+ fastSlide.speedInPages +'"></label><br><label>Size of thumbnails: <select><option '+ (function(){if(thumbSize==0) return 'select'})() +' value="0">Big</option><option '+ (function(){if(thumbSize==2) return 'select'})() +' value="2">Small</option></select></label><br><input type="reset"><input type="submit">';

	}

	function youTubeInit() {
		windowWidth = window.innerWidth;
		createDom();
		createBehavior();

		changeElemWidth();
		changeSliderWidth();
		//getElems('cute kittens');
		remakePaging();
	}

	function youTubeOnResize() {
		if (windowWidth != window.innerWidth){
			windowWidth = window.innerWidth;
			changeElemWidth();
			changeSliderWidth();
			remakePaging();
			toPage(getPageOnPosition());
		}
	}


	window.addEventListener('load', youTubeInit);
	window.addEventListener('resize', youTubeOnResize);
})(options);