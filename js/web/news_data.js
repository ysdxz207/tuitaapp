var pageOffset = 0;
var pageSize = 20;
var INIT = localStorage.getItem('INIT');
var KEY_LATEST_PUB_NEWS_DATE = 'KEY_LATEST_PUB_NEWS_DATE';

mui.init({
	swipeBack: false,
	statusBarBackground: '#ea2000', //设置状态栏颜色,仅iOS可用
	preloadPages: [{
		id: 'news_detail',
		url: 'news_detail.html'
	}]
});

(function($) {
	mui.plusReady(function() {
		$('.mui-scroll-wrapper').scroll({
			bounce: false,
			indicators: true //是否显示滚动条
		});

		hpb.dbReady(function(isFirst) {
			if(INIT == 'true') {
				isFirst = true;
			}
			console.info("[===]isFirst=" + isFirst);

			//第一次显示，从服务器获取
			if(isFirst) {
				//clearNewsList(channelId); //清空新闻列表内容
				mui.plusReady(function() {
					$.getNewsFromRemote(1, function(success) {
						
					});
				});
			} else {
				//非第一次，直接从本地数据库中读取
				$.getNewsFromWebsql(1, null, function() {

				});
				$.autoUpdateWithWifi(1, 0);

			}
		}, function(error, failingQuery) {
			console.error('[dbready]error:' + error.message + ',failing query=' + failingQuery);
		});

		//关闭闪屏页
		plus.navigator.closeSplashscreen();
		document.querySelector('.mui-slider').addEventListener('slide',
			function(event) {
				// 注意slideNumber是从0开始的；
				console.info("你正在看第" + (event.detail.slideNumber + 1) + "个选项卡");
				//var w2 = plus.nativeUI.showWaiting("加载中...");
				var isFirst = localStorage.getItem('KEY_ISFIRST' + (event.detail.slideNumber + 1));
				console.info("[===]isFirst=" + isFirst);
				//第一次显示，从服务器获取
				if(isFirst == 'undefined' || isFirst == null) {
					//clearNewsList(channelId); //清空新闻列表内容
					mui.plusReady(function() {
						$.getNewsFromRemote(event.detail.slideNumber + 1, function() {

						});
					});
				} else {
					//非第一次，直接从本地数据库中读取
					$.getNewsFromWebsql(event.detail.slideNumber + 1, null, function() {

					});
					$.autoUpdateWithWifi(event.detail.slideNumber + 1, 0);
				};
			});

		//循环初始化所有下拉刷新，上拉加载。
		$.each(document.querySelectorAll('.mui-slider-group .mui-scroll'), function(index, pullRefreshEl) {
			$(pullRefreshEl).pullToRefresh({
				down: {
					tips: {
						colors: ['EA2000', '#ff492f', '#ff9b8c', '#ff9b8c', '#ffe3df']
					},
					callback: function() {
						pageOffset = 0;
						pullDownRefreshNews(index + 1, this, "down");
					}
				},
				up: {
					contentinit: '',
					contentrefresh: '努力加载...',
					contentnomore: '已经到底啦！(＞人＜;)', //可选，请求完毕若没有更多数据时显示的提醒内容；
					callback: function() {
						pageOffset += pageSize;
						pullUpRefreshNews(index + 1, this, "up");
					}
				}
			});
		});
		/**
		 * 下拉刷新
		 * @param {Object} newsChannelId
		 * @param {Object} obj
		 * @param {Object} type
		 */
		var pullDownRefreshNews = function(newsChannelId, obj, type) {
			//初始化频道新闻最早发布时间
			sessionStorage.setItem(KEY_LATEST_PUB_NEWS_DATE + newsChannelId, Number.MAX_VALUE);
			//获取新闻列表，存储数据库
			$.getNewsFromRemote(newsChannelId, function() {
				endPullRefresh(obj, type);
			});
		};
		/**
		 * 上拉加载
		 * @param {Object} newsChannelId
		 * @param {Object} obj
		 * @param {Object} type
		 */
		var pullUpRefreshNews = function(newsChannelId, obj, type) {
			$.getNewsFromWebsql(newsChannelId, null, function(noData) {
				endPullRefresh(obj, type, noData);
			});
		};
		/**
		 * 结束下拉刷新和上拉加载(动画)
		 * @param {Object} obj
		 * @param {Object} type
		 */
		var endPullRefresh = function(obj, type, noData) {
			if(type == "up") {
				//pageOffset += pageSize;
				obj.endPullUpToRefresh(noData);
			} else if(type == "down") {
				obj.endPullDownToRefresh();
			}
		};

		mui(".mui-table-view").on("tap", ".mui-table-view-cell", function() {
			//var w = plus.nativeUI.showWaiting("加载中...");
			var newsBeanId = this.getAttribute('id');
			var newsChannelId = this.getAttribute('data-newschannelid');
			var detailPage = plus.webview.getWebviewById('news_detail');
			//触发详情页面的newsId事件
			mui.fire(detailPage, 'newsDetail', {
				id: newsBeanId
			});
			//显示启动导航
			mui.openWindow({
				id: 'news_detail',
				url: 'news_detail.html',
				show: {
					aniShow: 'slide-in-right', //fade-in,pop-in
					duration: 300
				},
				extras: {
					newsBeanId: newsBeanId,
					newsChannelId: newsChannelId
				},
				waiting: {
					autoShow: false
				}
			});
		});
	});
})(mui);