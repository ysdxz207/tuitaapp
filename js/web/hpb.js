window.hpb = {};
(function($, hpb, websql) {
	var INIT = localStorage.getItem('INIT');
	var DB_VERSION_NUMBER = '1.0';
	var SQL_TABLE = 'DROP TABLE IF EXISTS news;CREATE TABLE news (id INTEGER PRIMARY KEY, newsChannelId INTEGER, title TEXT,desc TEXT,content TEXT,contentWithImgs TEXT,html TEXT,source TEXT,faceUrl TEXT,pubDate INTEGER);';
	var NEWS_URL = localStorage.getItem("NEWS_URL");
	var PAGESIZE = localStorage.getItem("PAGESIZE");
	var KEY_NEWS_LAST_PUB_TIME = 'KEY_NEWS_LAST_PUB_TIME';
	var KEY_ISFIRST = 'KEY_ISFIRST';//tab 是否第一次加载
	var SQL_SELECT = 'SELECT id,newsChannelId,title,desc,content,contentWithImgs,html,source,faceUrl,pubDate FROM news WHERE newsChannelId = ? and pubDate < ? ORDER BY pubDate DESC LIMIT ?;';
	var SQL_INSERT = 'INSERT INTO news(id,newsChannelId,title,desc,content,contentWithImgs,html,source,faceUrl,pubDate) VALUES(?,?,?,?,?,?,?,?,?,?);';
	var SQL_DELETE = 'DELETE FROM news';
	var SQL_SELECT_DETAIL = 'SELECT * FROM news WHERE id = ? LIMIT 1;';
	
	hpb.dbReady = function(successCallback, errorCallback) {
		console.log('[=====]init='+INIT);
		html5sql.openDatabase("tuitanews", "tuitanews db", 5 * 1024 * 1024);
		if (INIT == 'true'){
			console.log('[###][news]开始重建数据库');
			hpb.resetNewsTable();
			console.log('[###][news]表已删除，并重新创建');
		};
		if(html5sql.database.version === '') {
			html5sql.changeVersion('', DB_VERSION_NUMBER, SQL_TABLE, function() {
				successCallback && successCallback(true);
			}, function(error, failingQuery) {
				errorCallback && errorCallback(error, failingQuery);
			});
		} else {
			successCallback && successCallback(false);
		};
	};
	/**
	 * 从服务器获取数据
	 * @param {Object} newsChannelId
	 * @param {Object} pageOffset
	 * @param {Object} successCallback
	 * @param {Object} errorCallback
	 */
	hpb.getNewsListFromRemote = function(newsChannelId, successCallback, errorCallback) {

		//没有网络显示本地缓存数据并提示
		if(plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
			plus.nativeUI.toast('糟糕！无法连接网络。', {
				verticalAlign: 'top'
			});
			successCallback(false);
			return;
		};

		//从服务器获取数据
		$.getRemote(NEWS_URL, {
			pageOffset: 0,
			pageSize: PAGESIZE,
			newsChannelId: newsChannelId
		}, function(remote) {
			console.log('[###]从服务器获取数据,条数=' + remote.newsList.length);
			if(remote.newsList.length > 0) {
				var newsList = [];
				newsList.reverse();
				
				var lastPubDate = eval(localStorage.getItem(KEY_NEWS_LAST_PUB_TIME + newsChannelId));
				
				//获取本地当前频道新闻最后发布时间
				var lastPubTime = parseInt(lastPubDate ? lastPubDate : 0);
				console.log('[===][缓存]新闻最后发布时间(newsChannelId=' + newsChannelId + ')：' + lastPubTime);
				$.each(remote.newsList, function(index, news) {
					var pubDate = hpb.getDateTime(news.pubDate);
					if(pubDate > lastPubTime) {
						newsList.push({
							"id": news.id,
							"newsChannelId": news.newsChannelId,
							"title": news.title,
							"desc": news.desc,
							"content": news.content,
							"contentWithImgs": news.contentWithImgs,
							"html": news.html,
							"source": news.source,
							"faceUrl": news.faceUrl,
							"pubDate": pubDate
						});
					}
				});
				remote.newsList = newsList;
				console.log('[===]从服务器获取到数据(最新)条数=' + remote.newsList.length);
				//获取服务器当前频道新闻最后发布时间
				if(remote.newsList.length > 0) {
					var remoteLastPubDate = remote.newsList[0].pubDate;
					localStorage.setItem(KEY_NEWS_LAST_PUB_TIME + newsChannelId, remoteLastPubDate);
					console.log('[===][服务器]新闻最后发布时间(newsChannelId=' + newsChannelId + ')：' + remoteLastPubDate);
					
					hpb.addNews(remote.newsList, function() {
						localStorage.setItem(KEY_ISFIRST + newsChannelId, 1);
						successCallback(remote.newsList.length);
					}, function(error, failingQuery) {
						console.error('[添加新闻到本地数据库错误]:' + error.message + ',query=' + failingQuery);
						successCallback(false);
					});
				} else {
					successCallback(false);
				};

			};
		}, function(xhr) {
			errorCallback && errorCallback();
		});
	};

	/**
	 * 从本地数据库查询新闻
	 * @param {Object} params
	 * @param {Object} successCallback
	 * @param {Object} errorCallback
	 */
	hpb.getNewsListFromWebsql = function(params, successCallback, errorCallback) {
		console.log('[###]从本地数据库获取数据');
		var newsChannelId = params.newsChannelId ? params.newsChannelId : 1;
		var latestPubNewsDate = params.latestPubNewsDate;
		console.log('[===]latestPubNewsDate=' + latestPubNewsDate + 
		',newsChannelId=' + newsChannelId);
		websql.process([{
			"sql": SQL_SELECT,
			"data": [newsChannelId, latestPubNewsDate, PAGESIZE]
		}], function(tx, results) {
			console.log('[===]从本地数据库获取数据成功，条数=' + results.rows.length);
			
			var newsList = [];
			newsList.reverse();
			for (var i=0; i < results.rows.length; i++) {
				newsList.push(results.rows.item(i));
			};
			results.newsList = newsList;
			successCallback(results);
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
		
	};
	/**
	 * 根据id查询新闻详情
	 * @param {Object} id
	 * @param {Object} successCallback
	 * @param {Object} errorCallback
	 */
	hpb.getNewsById = function(id, successCallback, errorCallback) {
		websql.process([{
			"sql": SQL_SELECT_DETAIL,
			"data": [id]
		}], function(tx, results) {
			console.log('[###]本地数据库查询到新闻详情，id=' + id);
			if (results.rows.length > 0){
				results.news = results.rows.item(0);
				successCallback(results);
			}
		}, function(error, failingQuery) {
			console.error(error.message);
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	/**
	 * 添加新闻
	 * @param {Object} newsList
	 * @param {Object} successCallback
	 * @param {Object} errorCallback
	 */
	hpb.addNews = function(newsList, successCallback, errorCallback) {
		var sqls = [];
		$.each(newsList, function(index, news) {
			var newsArr = [];
			for(n in news) {
				newsArr.push(news[n]);
			};
			sqls.push({
				"sql": SQL_INSERT,
				"data": newsArr
			});
		});
		console.log('[###]开始添加新闻到本地数据库,条数：' + newsList.length);
		websql.process(sqls, function(tx, results) {
			console.log("[###]添加新闻到本地数据库成功");
			successCallback(true);
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});

	};
	/**
	 * 重置数据库
	 * @param {Object} successCallback
	 * @param {Object} errorCallback
	 */
	hpb.resetNewsTable = function(successCallback, errorCallback) {
		websql.process(SQL_TABLE, function(tx, results) {
			successCallback && successCallback();
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	
	/**
	 * 获取时间毫秒
	 * @param {string} date
	 */
	hpb.getDateTime = function(date){
		return (new Date(Date.parse(date.replace(/-/g, "/")))).getTime();
	};
})(mui, hpb, html5sql);