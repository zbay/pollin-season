var requireLogin = function(req, res, next) {
  if (!req.session.sessionID) { //if no user is signed in
 	req.session.reset();
    res.redirect('/login');
  } else {
    next();
  }
};
module.exports = requireLogin;