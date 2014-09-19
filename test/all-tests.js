var PI2 = Math.PI * 2;

describe('#main', function(){
  it('should output the correct strict json for circle', function(){
    var context = this.test.context;

    context.beginPath();
    context.arc(50, 50, 30, 0, PI2, false);
    context.fillStyle = 'red';
    context.fill();

    assert.equal(context.json(), '[{"method":"beginPath","arguments":[]},{"method":"arc","arguments":[50,50,30,0,6.283185307179586,false]},{"attr":"fillStyle","val":"red"},{"method":"fill","arguments":[]}]');
  });

  it('should output the correct strict hash for circle', function(){
    var context = this.test.context;

    context.beginPath();
    context.arc(50, 50, 30, 0, PI2, false);
    context.fillStyle = 'red';
    context.fill();

    assert.equal(context.hash(), '593812a5c4abaae60c567bf96e59631d');
  });

  it('should output the correct loose json for circle', function(){
    var context = this.test.context;

    context.beginPath();
    context.arc(50, 50, 30, 0, PI2, false);
    context.fillStyle = 'red';
    context.fill();

    assert.equal(context.json({type: 'loose'}), '["beginPath","arc","fillStyle","fill"]');
  });

  it('should output the correct loose hash for circle', function(){
    var context = this.test.context;

    context.beginPath();
    context.arc(50, 50, 30, 0, PI2, false);
    context.fillStyle = 'red';
    context.fill();

    assert.equal(context.hash({type: 'loose'}), '7f2734b2c8027e5f8a1429e83361cb5c');
  });

  it('should capture instructions for a simple rectangle', function(){
    var context = this.test.context;

    context.beginPath();
    context.rect(10, 10, 100, 80);
    context.fillStyle = 'red';
    context.fill();

    assert.equal(context.hash(), '6d09e269a28763a02f82c532675da8c8');
  });

  it('should shorten the stack if it gets too large', function(){
    var context = this.test.context,
        origStackSize = Canteen.globals.STACK_SIZE;

    Canteen.globals.STACK_SIZE = 3;

    assert.equal(context.stack().length, 0);

    context.beginPath();
    assert.equal(context.stack().length, 1);

    context.closePath();
    assert.equal(context.stack().length, 2);

    context.beginPath();
    assert.equal(context.stack().length, 3);
    assert.equal(context.json(), '[{"method":"beginPath","arguments":[]},{"method":"closePath","arguments":[]},{"method":"beginPath","arguments":[]}]');


    // because the stack size is set to 3, pushing a new element on the stack
    // should result in the removal of the first item, therefore keeping the
    // stack at size 3
    context.closePath();
    assert.equal(context.stack().length, 3);
    assert.equal(context.json(), '[{"method":"closePath","arguments":[]},{"method":"beginPath","arguments":[]},{"method":"closePath","arguments":[]}]');

    // put the stack size back to the default for future tests
    Canteen.globals.STACK_SIZE = origStackSize;
  });

  it('should clear the stack when calling clear()', function(){
    var context = this.test.context;

    context.beginPath();
    context.rect(10, 10, 100, 80);
    context.fillStyle = 'red';
    context.fill();

    assert.equal(context.stack().length, 4);

    context.clear();
    assert.equal(context.stack().length, 0);

    context.beginPath();
    assert.equal(context.stack().length, 1);


  });
});