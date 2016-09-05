var pageOffset = 0;
var pageSize = 20;
var INIT = localStorage.getItem('INIT');
mui.init({
	swipeBack: false,
	statusBarBackground: '#ea2000', //设置状态栏颜色,仅iOS可用
	preloadPages: [{
		id: 'news_detail',
		url: 'news_detail.html'
	}]
});
(function($) {
	//阻尼系数
	var deceleration = mui.os.ios ? 0.003 : 0.0009;
	$('.mui-scroll-wrapper').scroll({
		bounce: false,
		indicators: true, //是否显示滚动条
		deceleration: deceleration
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
				$.getNewsFromRemote(1, 0);
			});
		} else {
			//非第一次，直接从本地数据库中读取
			$.getNewsFromWebsql(1, 0);
			$.autoUpdateWithWifi(1, 0);

		}
	}, function(error, failingQuery) {
		console.error('[dbready]error:' + error.message + ',failing query=' + failingQuery);
	});

	mui.plusReady(function() {

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
						$.getNewsFromRemote(event.detail.slideNumber + 1, 0);
					});
				} else {
					//非第一次，直接从本地数据库中读取
					$.getNewsFromWebsql(event.detail.slideNumber + 1, 0);
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
						pullRefreshNews(index + 1, pageOffset, this, "down");
					}
				},
				up: {
					contentinit: '',
					contentrefresh: '努力加载...',
					contentnomore: '已经到底啦！(＞人＜;)', //可选，请求完毕若没有更多数据时显示的提醒内容；
					callback: function() {
						pageOffset += pageSize;
						pullRefreshNews(index + 1, pageOffset, this, "up");
					}
				}
			});
		});
		var pullRefreshNews = function(newsChannelId, pageOffset, obj, type) {
			//获取新闻列表，存储数据库
			$.getNewsFromRemote(newsChannelId, pageOffset, obj, type);
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
					aniShow: 'slide-in-right', //fade-in
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