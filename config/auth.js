module.exports = {
    isLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        else {
            req.flash('danger', 'Please login');
            res.redirect('/users/login');
        }
    },
    isAdmin: (req, res, next) => {
        if (req.isAuthenticated() && res.locals.user.admin == 1) {
            return next();
        } 
        else {
            req.flash('danger', 'You are required to login as admin.');
            res.redirect('/users/login');
        }
    }
}