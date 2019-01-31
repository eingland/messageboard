/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Test POST /api/threads/:board with all fields filled out', function(done) {
        chai.request(server)
         .post('/api/threads/general')
         .send({text: 'test text', delete_password: '1234'})
         .end(function(err, res){
            //console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body.board, 'general', 'board contains general');
            assert.equal(res.body.text, 'test text', 'text contains test text');
            assert.property(res.body, 'created_on', 'created_on is a property');
            assert.property(res.body, 'bumped_on', 'bumped_on is a property');
            assert.equal(res.body.reported, false, 'reported equals false');
            assert.equal(res.body.delete_password, '1234', 'delete_password contains 1234');
            assert.equal(res.body.replies.length, 0, 'replies contains empty array');
            done();
        });
      });
      
      test('Test POST /api/threads/:board with no fields filled out', function(done) {
        chai.request(server)
         .post('/api/threads/general')
         .send()
         .end(function(err, res){
            //console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body, 'missing data fields', 'when post is missing data fields show missing data fields');
            done();
        });
      });
    });
    
    suite('GET', function() {
      test('Test GET /api/threads/:board', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              //console.log(res.body);
              assert.equal(res.status, 200);
              assert.isBelow(res.body.length, 11, 'get returns 10 or less threads');
              assert.equal(res.body[0].board, 'general', 'board contains general');
              assert.property(res.body[0], 'text', 'text is a property');
              assert.property(res.body[0], 'created_on', 'created_on is a property');
              assert.property(res.body[0], 'bumped_on', 'bumped_on is a property');
              assert.notProperty(res.body[0], 'reported', 'reported is not a property');
              assert.notProperty(res.body[0], 'delete_password', 'delete_password is not a property');
              if (res.body[0].replies.length > 0) {
                assert.notProperty(res.body[0].replies[0], 'reported', 'reported is not a property of a reply');
                assert.notProperty(res.body[0].replies[0], 'delete_password', 'delete_password is not a property of a reply'); 
              }
              assert.isBelow(res.body[0].replies, 4, 'less than 4 replies');
              done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Test DELETE /api/threads/:board Correct Password', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              var threadid = res.body[0]._id;
              chai.request(server)
                 .delete('/api/threads/general')
                 .send({thread_id: threadid, delete_password: "1234"})
                 .end(function(err, res2){
                    //console.log(res2.body);
                    assert.equal(res.status, 200);
                    assert.equal(res2.body, 'success', 'delete operation successful');
                    done();
              });
        });
      });
      
      test('Test DELETE /api/threads/:board Incorrect Password', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              //console.log(res.body[0]);
              var threadid = res.body[0]._id;
              chai.request(server)
                 .delete('/api/threads/general')
                 .send({thread_id: threadid, delete_password: "wrongpassword"})
                 .end(function(err, res2){
                    //console.log(res2.body);
                    assert.equal(res.status, 200);
                    assert.equal(res2.body, 'incorrect password', 'delete operation fails when password does not match');
                    done();
              });
        });
      });
    });
    
    suite('PUT', function() {
      test('Test PUT /api/threads/:board', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              //console.log(res.body[0]);
              var threadid = res.body[0]._id;
              chai.request(server)
                 .put('/api/threads/general')
                 .send({thread_id: threadid})
                 .end(function(err, res2){
                    //console.log(res2.body);
                    assert.equal(res.status, 200);
                    assert.equal(res2.body, 'success', 'delete operation successful');
                    done();
              });
        });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
      test('Test POST /api/replies/:board with all fields filled out', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              var threadid = res.body[0]._id;
              chai.request(server)
               .post('/api/replies/general')
               .send({thread_id: threadid, text: 'test reply text', delete_password: '1234'})
               .end(function(err, res2){
                  //console.log(res2.body);
                  assert.equal(res2.status, 200);
                  assert.equal(res2.body.board, 'general', 'board contains general');
                  assert.equal(res2.body.replies[0].text, 'test reply text', 'text contains test reply text');
                  assert.property(res2.body, 'created_on', 'created_on is a property');
                  assert.property(res2.body, 'bumped_on', 'bumped_on is a property');
                  assert.equal(res2.body.delete_password, '1234', 'delete_password contains 1234');
                  assert.isAbove(res2.body.replies.length, 0, 'replies contains at least one object');
                  done();
              });
          });
      });
      
      test('Test POST /api/replies/:board with no fields filled out', function(done) {
        chai.request(server)
         .post('/api/replies/general')
         .send()
         .end(function(err, res){
            //console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body, 'missing data fields', 'when post is missing data fields show missing data fields');
            done();
        });
      });
    });
    
    suite('GET', function() {
      test('Test GET /api/replies/:board', function(done) {
      chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
             var threadid = res.body[0]._id;
             chai.request(server)
               .get('/api/replies/general')
               .query({thread_id: threadid})
               .end(function(err, res2){
                  //console.log(res.body);
                  assert.equal(res.status, 200);
                  assert.equal(res.body[0].board, 'general', 'board contains general');
                  assert.property(res.body[0], 'text', 'text is a property');
                  assert.property(res.body[0], 'created_on', 'created_on is a property');
                  assert.property(res.body[0], 'bumped_on', 'bumped_on is a property');
                  assert.notProperty(res.body[0], 'reported', 'reported is not a property');
                  assert.notProperty(res.body[0], 'delete_password', 'delete_password is not a property');
                  assert.notProperty(res.body[0].replies[0], 'reported', 'reported is not a property of a reply');
                  assert.notProperty(res.body[0].replies[0], 'delete_password', 'delete_password is not a property of a reply');
                  assert.property(res.body[0], 'replies', 'replies is a property');
                  done();
              });
          });
      });
    });
    
    suite('PUT', function() {
      test('Test PUT /api/replies/:board', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              //console.log(res.body[0]);
              var threadid = res.body[0]._id;
              var replyid = res.body[0].replies[0]._id;
              chai.request(server)
                 .put('/api/replies/general')
                 .send({thread_id: threadid, reply_id: replyid})
                 .end(function(err, res2){
                    //console.log(res2.body);
                    assert.equal(res.status, 200);
                    assert.equal(res2.body, 'success', 'put operation successful');
                    done();
              });
        });
      });
    });
    
    suite('DELETE', function() {
      test('Test DELETE /api/replies/:board Correct Password', function(done) {
        chai.request(server)
           .get('/api/threads/general')
           .end(function(err, res){
              //console.log(res.body[0]);
              var threadid = res.body[0]._id;
              var replyid = res.body[0].replies[0]._id;
              chai.request(server)
                 .delete('/api/replies/general')
                 .send({thread_id: threadid, reply_id: replyid, delete_password: '1234'})
                 .end(function(err, res2){
                    //console.log(res2.body);
                    assert.equal(res.status, 200);
                    assert.equal(res2.body, 'success', 'delete operation successful');
                    done();
              });
        });
      });
      
      test('Test DELETE /api/replies/:board Incorrect Password', function(done) {
        chai.request(server)
             .get('/api/threads/general')
             .end(function(err, res){
                //console.log(res.body[0]);
                var threadid = res.body[0]._id;
                var replyid = res.body[0].replies[0]._id;
                chai.request(server)
                   .delete('/api/replies/general')
                   .send({thread_id: threadid, reply_id: replyid, delete_password: 'wrongpassword'})
                   .end(function(err, res2){
                      //console.log(res2.body);
                      assert.equal(res.status, 200);
                      assert.equal(res2.body, 'incorrect password', 'delete operation fails when password does not match');
                      done();
                });
          });
      });

    });

  });
  
});