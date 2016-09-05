(function($) {
	var NEWS_LIST_TEMPLATE_ID = 'news_list_template';
	var templateContainers = $('.mui-table-view');
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
	$.getNewsFromWebsql = function(newsChannelId, pageOffset) {
			hpb.getNewsListFromWebsql({
				"newsChannelId": newsChannelId,
				"pageOffset": pageOffset
			}, function(data) {
				var html = template(NEWS_LIST_TEMPLATE_ID, data);
				templateContainers[newsChannelId - 1].innerHTML = html + templateContainers[newsChannelId - 1].innerHTML;
				console.timeEnd('从本地数据库获取数据到结束时间');
			}, function(error, failingQuery) {
				console.error('[从本地数据库查询新闻列表错误]:' + error.message + ":" + failingQuery);
			});
		}
		/**
		 * 从服务器获取数据
		 * @param {Object} channelId
		 * @param {Object} pageOffset
		 */
	$.getNewsFromRemote = function(channelId, pageOffset, obj, type) {
		//获取新闻列表，存储数据库
		hpb.getNewsListFromRemote(channelId, pageOffset, function(data) {
			if(data) {
				console.info('data=======' + data);
				var html = template(NEWS_LIST_TEMPLATE_ID, data);
				templateContainers[channelId - 1].innerHTML = html + templateContainers[channelId - 1].innerHTML;
				plus.nativeUI.toast('更新了' + data.newsList.length + '条');
				console.info('[===]haseNew=' + data.newsList.length);
			} else {
				console.log('[###]没有新数据');
			}
			$.endPullRefresh(obj, type);
		}, function(error) {
			console.error('[从服务器获取新闻错误]:' + error);
		});
	};
	/**
	 * 结束下拉刷新(动画)
	 * @param {Object} obj
	 * @param {Object} type
	 */
	$.endPullRefresh = function(obj, type) {
		if(type == "up") {
			//pageOffset += pageSize;
			obj.endPullUpToRefresh();
		} else if(type == "down") {
			obj.endPullDownToRefresh();
		}
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
					$.getNewsFromRemote(newsChannelId, pageOffset);
				}, 100);
			};
		});
	}
})(mui);