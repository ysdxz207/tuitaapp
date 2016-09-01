mui.plusReady(function() {
	var self = plus.webview.currentWebview();
	var newsBeanId = self.newsBeanId;
	var newsChannelId = self.newsChannelId;
	console.log("newsBeanId====" + newsBeanId);
	loadNewsDetail(newsBeanId);

	function loadNewsDetail(newsBeanId) {
		var params = {};
		params.newsBeanId = newsBeanId;
		mui.ajax(plus.storage.getItem("news_detail_url"), {
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