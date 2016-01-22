module.exports = function(app) {
app.get('/', function(req, res){
	if(req.session.sessionID){
		res.redirect("/newPoll");
	}
	else{
		req.session.reset();
		res.render('index', {seshName: req.session.sessionName});	
	}
});
}