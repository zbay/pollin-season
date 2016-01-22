module.exports = function(app) {
app.use(function(req, res) {
	res.status(404).render("404", {seshName: req.session.sessionName});
});
app.use(function(error, req, res, next) {
    res.status(500).render("500", {seshName: req.session.sessionName});
});
}