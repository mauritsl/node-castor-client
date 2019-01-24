
var BigNumber = require('big-number');

var Bignum = function(input) {
  this._num = BigNumber(input);
  return this;
};

Bignum.prototype.sub = function(num) {
  var output = new Bignum(this._num);
  output._num.subtract(num.toString());
  return output;
};

Bignum.prototype.lt = function(num) {
  var a = this._num.toString();
  var b = num.toString();
  if (a == b) {
    return false;
  }
  if (a[0] == '-' && b[0] != '-') {
    return true;
  }
  if (a[0] != '-' && b[0] == '-') {
    return false;
  }
  if (a[0] == '-') {
    return (a.length === b.length) ? a > b : a.length > b.length;
  }
  return (a.length === b.length) ? a < b : a.length < b.length;
};

Bignum.prototype.gt = function(num) {
  var a = this._num.toString();
  var b = num.toString();
  if (a == b) {
    return false;
  }
  return !this.lt(num);
};

Bignum.prototype.toString = function(num) {
  return this._num.toString();
};

var create = function(input) {
  return new Bignum(input);
};

create.fromBuffer = function(buf) {
  var num = BigNumber(0);
  var base = BigNumber(1);
  for (var i = buf.length - 1; i >= 0; --i) {
    num = num.add(BigNumber(base).multiply(buf[i]));
    base = base.multiply(256);
  }
  return new Bignum(num);
};

create.pow = function(a, b) {
  var output = new BigNumber(a);
  var newInt = output.pow(b).toString();
  return new Bignum(newInt);
};

module.exports = create;
