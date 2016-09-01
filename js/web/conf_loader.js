mui.init();

mui.plusReady(function() {

	mui.getJSON('json/ajax_url.json', {}, function(data) {
		plus.storage.setItem("base_url", data.base_url);
		plus.storage.setItem("news_url", data.news_url);
		plus.storage.setItem("news_detail_url", data.news_detail_url);
	});
});