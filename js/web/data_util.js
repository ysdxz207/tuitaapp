(function($) {
	var NEWS_LIST_TEMPLATE_ID = 'news_list_template';
	var templateContainers = $('.mui-table-view');
	var KEY_LATEST_PUB_NEWS_DATE = 'KEY_LATEST_PUB_NEWS_DATE';
	
	

	$.getRemote = function(url, params, success, error) {
		console.log('[###]从服务器获取数据,url=' + url);
		error = error || $.noop;
		$.ajax({
			data: params,
			type: "get",
			url: url,
			dataType: 'json',
			success: function(response) {
				if(!response) {
					return error();
				}
				success(response);
			},
			error: error
		});
	};
	/**
	 * 从本地数据库获取数据
	 * @param {Object} channelId
	 * @param {Object} pageOffset
	 */
	$.getNewsFromWebsql = function(newsChannelId, hasNew, noDataCallback) {
			hpb.getNewsListFromWebsql({
				"newsChannelId": newsChannelId,
				"latestPubNewsDate": $.getLatestPubNewsDate(newsChannelId)
			}, function(data) {
				if(!data || !data.newsList || data.newsList.length == 0) {
					noDataCallback(true);
					return;
				};
				$.reloadNews(newsChannelId, data);
				
				if(hasNew) {
					mui.toast('更新了' + hasNew + '条');
				} else {
					console.log('[###]没有新数据');
				};
				noDataCallback(false);
			}, function(error, failingQuery) {
				console.error('[从本地数据库查询新闻列表错误]:' + error.message + ":" + failingQuery);
			});
		}
		/**
		 * 从服务器获取数据
		 * @param {Object} newsChannelId
		 * @param {Object} pageOffset
		 */
	$.getNewsFromRemote = function(newsChannelId, successCallback) {
		//获取新闻列表，存储数据库
		hpb.getNewsListFromRemote(newsChannelId, function(hasNew) {
			$.getNewsFromWebsql(newsChannelId, hasNew, function() {

			});
			
			successCallback(true);
		}, function(error) {
			console.error('[从服务器获取新闻错误]:' + error);
		});
	};

	/**
	 * 从本地数据库查询新闻详情
	 * @param {Object} id
	 * @param {Object} successCallback
	 * @param {Object} errorCallback
	 */
	$.getNewsDetail = function(id) {
		html5sql.openDatabase("tuitanews", "tuitanews db", 5 * 1024 * 1024);
		hpb.getNewsById(id, function(data) {
			var html = template('news_detail_template', data);
			document.getElementById('mui_content').innerHTML = html;
			
		}, function(error, failingQuery) {
			console.error('[从本地数据库查询新闻详情错误]:' + error.message + ":" + failingQuery);
		});
	};

	/**
	 * wifi环境自动更新
	 * @param {Object} newsChannelId
	 * @param {Object} pageOffset
	 */
	$.autoUpdateWithWifi = function(newsChannelId, pageOffset) {
		mui.plusReady(function() {
			if(plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_WIFI) {
				setTimeout(function() {
					$.getNewsFromRemote(newsChannelId, function() {

					});
				}, 100);
			};
		});
	};
	/**
	 * 更新tab内容
	 * @param {Object} newsChannelId
	 * @param {Object} data
	 */
	$.reloadNews = function(newsChannelId, data) {
		//更新html
		var html = template(NEWS_LIST_TEMPLATE_ID, data);
		//获取当前页最新发布时间
		if($.getLatestPubNewsDate(newsChannelId) === Number.MAX_VALUE && data.newsList && data.newsList.length > 0) {
			templateContainers[newsChannelId - 1].innerHTML = html;
		} else {
			templateContainers[newsChannelId - 1].innerHTML += html;
		};
		latestPubNewsDate = data.newsList[data.newsList.length - 1].pubDate;
		sessionStorage.setItem(KEY_LATEST_PUB_NEWS_DATE + newsChannelId, latestPubNewsDate);
	};
	/**
	 * 获取频道新闻最早发布时间
	 * @param {Object} newsChannelId
	 */
	$.getLatestPubNewsDate = function(newsChannelId){
		//初始化频道新闻最早发布时间
		var tmp = sessionStorage.getItem(KEY_LATEST_PUB_NEWS_DATE + newsChannelId);
		return tmp ? parseInt(tmp) : Number.MAX_VALUE;
	};
})(mui);