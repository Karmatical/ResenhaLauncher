/**
 * Script for welcome.ejs
 */
document.getElementById('welcomeButton').addEventListener('click', e => {
    loginCancelEnabled(false) // False by default, be explicit.
    loginViewOnLoginSuccess = VIEWS.landing
    loginViewOnLoginCancel = VIEWS.login
    switchView(VIEWS.welcome, VIEWS.login)
})