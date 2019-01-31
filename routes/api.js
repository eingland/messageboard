/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectId;

const CONNECTION_STRING = process.env.DB;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async function (req, res){
        return res.json(await MongoClient.connect(CONNECTION_STRING)
                        .then(function(db) {
                                var dbo = db.db("freecodecamp");
                                dbo.createCollection("threads", function(err, res) {
                                      if (err) throw err;
                                    });
                                if (req.body.text && req.body.delete_password) {
                                  var newThread = {board: req.params.board, text: req.body.text, created_on: new Date(), bumped_on: new Date(), reported: false, delete_password: req.body.delete_password, replies: []};
                                  return dbo.collection("threads")
                                            .insertOne(newThread)
                                            .then(function(res) {
                                              return res.ops[0];
                                            })
                                            .catch((err)=>{
                                              console.error(err)
                                            });
                                } else {
                                  return "missing data fields";
                                }
                        }));
    })

    .get(async function (req, res){
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          if (err) throw err;
          var dbo = db.db("freecodecamp");
          dbo.collection("threads")
            .find({board: req.params.board})
            .sort({bumped_on: -1})
            .limit(10)
            .toArray(function(err, res2) {
            if (err) throw err;
            var result = res2.map((val, i, arr) => {
             if (typeof val.replies != "undefined" && val.replies != null && val.replies.length != null && val.replies.length > 0) {
               var filteredReplies = val.replies.map((x) => { return {_id: x._id, created_on: x.created_on, text: x.text} });
               return {_id: val._id, board: val.board, text: val.text, created_on: val.created_on, bumped_on: val.bumped_on, replies: filteredReplies.length > 3 ? filteredReplies.slice(filteredReplies.length-3) : filteredReplies, replycount: filteredReplies.length};
             } else {
               return {_id: val._id, board: val.board, text: val.text, created_on: val.created_on, bumped_on: val.bumped_on, replies: [], replycount: 0};
             }
            });
            return res.json(result);
          });
      });
    })

    .delete(async function (req, res){
      var thread = req.body.thread_id;
        MongoClient.connect(CONNECTION_STRING, async function(err, db) {
          if (err) throw err;
          var dbo = db.db("freecodecamp");
          var collection = dbo.collection("threads");
          var threadDocument = await collection.findOne({_id: new ObjectId(thread)});
          if (threadDocument != null && threadDocument.delete_password === req.body.delete_password) {
            collection.deleteOne({_id: thread}, function (err, res2) {
                                    if (err) throw err;
                                    db.close();
                                    res.json("success");
            });
          } else {
            res.json("incorrect password"); 
          }
        });
    })

    .put(async function (req, res){
      var threadid = req.body.thread_id;
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        var dbo = db.db("freecodecamp");
        var newvalues = { $set: {reported: true} };
        dbo.collection("threads").findAndModify({ _id: new ObjectId(threadid) }, {}, newvalues, {new:true}, function (err, res2) {
                                      if (err) throw err;
                                      db.close();
                                      res.json('success');
        });
      });
    });

  app.route('/api/replies/:board')
    .post(async function (req, res){
      if (req.body.thread_id && req.body.text && req.body.delete_password) {
      var threadid = req.body.thread_id;
      var comment = req.body.comment;
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        var dbo = db.db("freecodecamp");
        dbo.collection("threads").find({ _id: new ObjectId(threadid) }).toArray(function(err, result) {
          if (err) throw err;
          var reply = {_id: new ObjectId(), created_on: new Date(), text: req.body.text, reported: false, delete_password: req.body.delete_password};
          if (typeof result[0].replies != "undefined" && result[0].replies != null && result[0].replies.length != null && result[0].replies.length > 0) {
            var newvalues = { $set: {bumped_on: new Date(), replies: [...result[0].replies, reply]} };
          } else {
            var newvalues = { $set: {bumped_on: new Date(), replies: [reply]} };
          }
          dbo.collection("threads").findAndModify({ _id: new ObjectId(threadid) }, {}, newvalues, {new:true}, function (err, results) {
                                        if (err) return res.json("failed to post reply");
                                        db.close();
                                        res.json(results.value);
          });
         });
      });   
      } else {
       res.json("missing data fields"); 
      }
    })
  
    .get(async function (req, res){
      var threadid = req.query.thread_id;
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
          if (err) throw err;
          var dbo = db.db("freecodecamp");
          dbo.collection("threads")
            .find({_id: new ObjectId(threadid)})
            .toArray(function(err, res2) {
              if (err) throw err;
              var result = res2.map((val, i, arr) => {
               if (typeof val.replies != "undefined" && val.replies != null && val.replies.length != null && val.replies.length > 0) {
                 var filteredReplies = val.replies.map((x) => { return {_id: x._id, created_on: x.created_on, text: x.text} });
                 return {_id: val._id, board: val.board, text: val.text, created_on: val.created_on, bumped_on: val.bumped_on, replies: filteredReplies};
               } else {
                 return {_id: val._id, board: val.board, text: val.text, created_on: val.created_on, bumped_on: val.bumped_on, replies: []};
               }
              });
              return res.json(result);
          });
      });
    })

    .delete(async function (req, res){
      var threadid = req.body.thread_id;
      var replyid = req.body.reply_id;
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        var dbo = db.db("freecodecamp");
        dbo.collection("threads").find({ _id: new ObjectId(threadid) }).toArray(function(err, result) {
          if (err) throw err;
          if (result[0].delete_password === req.body.delete_password) {
            var updatedreplies = result[0].replies;
            for (var i in updatedreplies) {
                if (replyid == updatedreplies[i]._id) { 
                  updatedreplies[i].text = "[Deleted]";
                }
            }
            var newvalues = { $set: {replies: updatedreplies } };
            dbo.collection("threads").findAndModify({ _id: new ObjectId(threadid) }, {}, newvalues, {new:true}, function (err, res2) {
                                          if (err) throw err;
                                          db.close();
                                          res.json("success");
            });
          } else {
           res.json("incorrect password");
          }
         });
      });
    })

    .put(async function (req, res){
      var threadid = req.body.thread_id;
      var replyid = req.body.reply_id;
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        var dbo = db.db("freecodecamp");
        dbo.collection("threads").find({ _id: new ObjectId(threadid) }).toArray(function(err, result) {
          if (err) throw err;
          var updatedreplies = result[0].replies;
          for (var i in updatedreplies) {
              if (replyid == updatedreplies[i]._id) { 
                updatedreplies[i].reported = true;
              }
          }
          var newvalues = { $set: {replies: updatedreplies } };
          dbo.collection("threads").findAndModify({ _id: new ObjectId(threadid) }, {}, newvalues, {new:true}, function (err, res2) {
                                        if (err) throw err;
                                        db.close();
                                        res.json("success");
            });
         });
      });
    });
};
