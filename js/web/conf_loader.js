mui.init();

mui.plusReady(function() {
	
	/**
	 * 服务器地址配置
	 */
	mui.getJSON('json/ajax_url.json', {}, function(data) {
		localStorage.setItem("BASE_URL", data.base_url);
		localStorage.setItem("NEWS_URL", data.news_url);
		localStorage.setItem("NEWS_DETAIL_URL", data.news_detail_url);
		console.log('[conf]BASE_URL=' + data.base_url);
	});
	/**
	 * app配置
	 */
	mui.getJSON('json/app_conf.json', {}, function(data) {
		if (data.init) {
			for (var i=0;i<10; i++){
				localStorage.removeItem('KEY_NEWS_LAST_PUB_TIME' + i);
				localStorage.removeItem('KEY_ISFIRST' + i);
			}
			
		}
		localStorage.setItem("INIT", data.init);
		localStorage.setItem("PAGESIZE", data.page.pageSize);
		console.log('[conf]PAGESIZE=' + data.page.pageSize);
	});
});