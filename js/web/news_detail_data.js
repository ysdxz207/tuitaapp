mui.init({
	gestureConfig: {
		doubletap: true
	},
	swipeBack: true, //启用右滑关闭功能
	beforeback: function (){
		//显示详情页加载中
		document.getElementById('news_detail_loading').className = 'sk-folding-cube show';
	}
});

(function($) {
	mui.plusReady(function() {
		//添加newsDetail自定义事件监听
		window.addEventListener('newsDetail', function(event) {
			document.getElementById('mui_content').innerHTML = '';

			//获得事件参数
			var id = event.detail.id;
			mui.scrollTo(0, 0); //0毫秒内滚动到顶部
			//根据id向服务器请求新闻详情
			//loadNewsDetail(id);
			$.getNewsDetail(id);
			//关闭详情页加载中
			document.getElementById('news_detail_loading').className = 'sk-folding-cube hide';
		});

		function loadNewsDetail(newsBeanId) {
			var params = {};
			params.newsBeanId = newsBeanId;
			mui.ajax(localStorage.getItem("NEWS_DETAIL_URL"), {
				data: params,
				dataType: 'json', //服务器返回json格式数据
				type: 'post', //HTTP请求类型
				timeout: 10000, //超时时间设置为10秒；
				//headers:{'Content-Type':'application/json'},	              
				success: function(data) {
					console.log("news detail data=" + data);
					console.log("and news id =" + data.news.id);
					var html = template('news_detail_template', data);
					document.getElementById('mui_content').innerHTML = html;
				},
				error: function(xhr, type, errorThrown) {
					//异常处理；
					console.error("ajax error type =" + type);
				}
			});
			//plus.nativeUI.closeWaiting();
		};

	});

})(mui);