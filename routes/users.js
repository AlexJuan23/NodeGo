var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/userlist', function(req, res) {
  var db = req.db;
  db.collection('userlist').find().toArray(function (err, items) {
      res.json(items);
  });
});

router.post('/adduser', function(req, res) {
    var db= req.db
    db.collection('userlist').insert(req.body, function(err, result){
        res.send(
            err === null ? {msg: '' } : {msg: err}
            );
    });
});
router.post('/addcurrentuser', function(req, res) {
    var db = req.db;
    db.collection('currentuser').insert(req.body, function(err, result){
        res.send(
            err === null ? {msg: '' } : {msg: err}
            );
    });
});
router.get('/getcurrentuser/', function(req, res) {
    var db = req.db;
    db.collection('currentuser').find().toArray(function(err, items){
        res.json(items);
    });
});
router.put('/currentuser/:id', function(req, res) {
    var db = req.db;
    var id = req.params.id;
    var doc = {$set : req.body};
    db.collection('currentuser').updateById(id, doc, function(err, result){
        res.send((result === 1) ? {msg: ''} : {msg: 'error: ' + err});
     });
});
router.get('/gogame/:username', function(req, res) {
    res.render('goGame');
});
router.put('/updateuser/:_id', function(req, res) {
    var db =req.db;
    var id = req.params._id;
    var doc = {$set : req.body};
    db.collection('userlist').updateById(id, doc, function(err, result){
        res.send((result === 1) ? {msg: ''} : {msg: 'error: ' + err});
    });
});
    

module.exports = router;
