var pageOffset = 0;
var pageSize = 20;

mui.init({
	swipeBack: false,
	statusBarBackground: '#ea2000', //设置状态栏颜色,仅iOS可用
	preloadLimit: 5 //预加载窗口数量限制(一旦超出,先进先出)默认不限制
});

(function($) {
	//阻尼系数
	var deceleration = mui.os.ios ? 0.003 : 0.0009;
	$('.mui-scroll-wrapper').scroll({
		bounce: false,
		indicators: true, //是否显示滚动条
		deceleration: deceleration
	});

	mui.plusReady(function() {
		// 弹出系统等待对话框
		var w2 = plus.nativeUI.showWaiting("加载中...");

		loadNewsData(null, null, 0); //打开app加载数据
		document.querySelector('.mui-slider').addEventListener('slide',
			function(event) {
				// 注意slideNumber是从0开始的；
				console.info("你正在看第" + (event.detail.slideNumber + 1) + "个选项卡");
				var w2 = plus.nativeUI.showWaiting("加载中...");
				loadNewsData(null, null, event.detail.slideNumber);
			});

		//循环初始化所有下拉刷新，上拉加载。
		$.each(document.querySelectorAll('.mui-slider-group .mui-scroll'), function(index, pullRefreshEl) {
			$(pullRefreshEl).pullToRefresh({
				down: {
					tips: {
						colors: ['EA2000']
					},
					callback: function() {
						loadNewsData(this, "down", index);
					}
				},
				up: {
					contentinit: '',
					contentrefresh: '努力加载...',
					contentnomore: '已经到底啦！(＞人＜;)', //可选，请求完毕若没有更多数据时显示的提醒内容；
					callback: function() {
						pageOffset += pageSize;
						loadNewsData(this, "up", index);
					}
				}
			});
		});

		function loadNewsData(obj, type, newsChannelId) {
			console.log('==============load data url=' + plus.storage.getItem("news_url"));
			var templateContainers = document.querySelectorAll('.mui-table-view');
			var params = {};
			params.pageOffset = pageOffset;
			params.pageSize = pageSize;
			params.newsChannelId = newsChannelId + 1;
			mui.ajax(plus.storage.getItem("news_url"), {
				data: params,
				dataType: 'json', //服务器返回json格式数据
				type: 'get', //HTTP请求类型
				timeout: 10000, //超时时间设置为10秒；
				//headers:{'Content-Type':'application/json'},	              
				success: function(data) {
					console.log(data);
					var flag = true; //没有更多数据了
					if(data.newsList.length > 0) {
						var html = template('news_list_template', data);
						if(type == "up") {
							templateContainers[newsChannelId].innerHTML += html;
						} else {
							templateContainers[newsChannelId].innerHTML = html;
						}
						flag = false;
					}
					if(obj) {
						if(type == "up") {
							//pageOffset += pageSize;
							obj.endPullUpToRefresh(flag);
						} else if(type == "down") {
							obj.endPullDownToRefresh(flag);

						}
					}
					plus.nativeUI.closeWaiting(); //关闭loading
				},
				error: function(xhr, type, errorThrown) {
					//异常处理；
					console.error("ajax error type =" + type);
				}
			});
		};

	});

	//
	mui(".mui-table-view").on("tap", ".mui-table-view-cell", function() {
		//var w = plus.nativeUI.showWaiting("加载中...");

		var newsBeanId = this.getAttribute('data-newsbeanid');
		var newsChannelId = this.getAttribute('data-newschannelid');
		//显示启动导航
		mui.openWindow({
			id: 'news_detail',
			url: 'news_detail.html',
			show: {
				aniShow: 'slide-in-right',//fade-in
				duration: 300
			},
			extras: {
				newsBeanId: newsBeanId,
				newsChannelId: newsChannelId
			},
			waiting: {
				autoShow: true
			}
		});
	});
})(mui);