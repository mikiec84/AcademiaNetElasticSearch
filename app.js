var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var ElasticSearch = require('elasticsearch');
var firebase = require('firebase');

var app = express();

const DB_INDEX = 'database';
const DB_TYPE = 'firebasedb';
const DB_ID = 'AVqXk7pk0-62svsQOGrg';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

// initialize our ElasticSearch API
var client = new ElasticSearch.Client({
    host: 'https://f5nchtuc:ro2dhduyt8ul0d0f@ivy-2940175.us-east-1.bonsaisearch.net',
    log: 'trace'
});

const firebaseConfig = {
    apiKey: "AIzaSyDQuTZRC0CaIctwAyVlchP_J1shY-EN6jU",
    authDomain: "sofe-4870-project.firebaseapp.com",
    databaseURL: "https://sofe-4870-project.firebaseio.com",
    storageBucket: "sofe-4870-project.appspot.com",
    messagingSenderId: "114732260320"
};

firebase.initializeApp(firebaseConfig);

function beginHandler() {
    var db = firebase.database().ref('/');
    var udb = firebase.database().ref('/test');

    udb.on('value', function (snap) {
        console.log(snap.val());
    });

    db.on('child_added', createOrUpdateIndex);
    db.on('child_changed', createOrUpdateIndex);
    db.on('child_removed', removeIndex);

    // Test the connection...
    client.ping({
            requestTimeout: 30000,
            hello: "elasticsearch"
        },
        function (error) {
            if (error) {
                console.error('elasticsearch cluster is down!');
            } else {
                console.log('All is well');
            }
        }
    );

}
firebase.auth().signInWithEmailAndPassword("dominick.mancini@uoit.net", "adminaccount")
    .then(function () {
        console.log("Firebase Authenticated and Ready for Communication");
        beginHandler()
    })
    .catch(function (error) {
        // Handle Errors here.
        var errorMessage = error.message;
        console.error("ERR:", errorMessage);
        // ...
    });

function createOrUpdateIndex(snap) {
    console.log("Updating");
    client.index( {
        index: DB_INDEX,
        type: DB_TYPE,
        body: JSON.stringify(snap.val())
    }, function (error, response) {
        console.log('indexed ', snap.getKey() , response);
        console.log("VERIFYING");
        //testGetData();
        if(error){
            console.error("ERROR:", error)
        }
    });
}

// TODO: Update this code if we ever implement this utility. (Might be too complicated, already is)
function removeIndex(snap) {
    console.log("Removing...");
    client.deleteDocument('database', 'firebasedb', snap.getKey(), function (error, data) {
        if (error) console.error('failed to delete', snap.getKey(), error);
        else console.log('deleted', snap.getKey());
    });
}

function testGetData(){
    // WARNING: Test Data contains in excess of 1400 objects, use caution when executing this function.
    client.get({
        index: DB_INDEX,
        type: DB_TYPE,
        id: DB_ID
    }, function (error, response) {
        console.log('got', response);
        if(error){
            console.log("ERROR", error);
        }
        // ...
    });
}
