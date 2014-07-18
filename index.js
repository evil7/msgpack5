
var assert = require('assert')

function msgpack() {

  function encode(obj) {
    var buf

    if (obj === null) {
      buf = new Buffer(1)
      buf[0] = 0xc0
    }

    if (obj === true) {
      buf = new Buffer(1)
      buf[0] = 0xc3
    }

    if (obj === false) {
      buf = new Buffer(1)
      buf[0] = 0xc2
    }

    if (typeof obj === 'number') {
      if (obj < -128) {
        buf = new Buffer(3)
        buf[0] = 0xd1
        buf.writeInt16BE(obj, 1)
      } else if (obj <= -32) {
        buf = new Buffer(2)
        buf[0] = 0xd0
        buf.writeInt8(obj, 1)
      } else if (obj < 0) {
        buf = new Buffer(1)
        buf[0] = 0xe0 | -obj
      } else if (obj < 128) {
        buf = new Buffer(1)
        buf[0] = obj
      } else if (obj < 256) {
        buf = new Buffer(2)
        buf[0] = 0xcc
        buf[1] = obj
      } else if (obj < 65536) {
        buf = new Buffer(3)
        buf[0] = 0xcd
        buf.writeUInt16BE(obj, 1)
      } else if (obj < 0xffffffff) {
        buf = new Buffer(5)
        buf[0] = 0xce
        buf.writeUInt32BE(obj, 1)
      } else {
        buf = new Buffer(9)
        buf[0] = 0xcf

        write64BitUint(buf, obj)
      }
    }

    return buf
  }

  function decode(buf) {
    assert(Buffer.isBuffer(buf), 'must be a Buffer')
    assert(buf.length > 0, 'must not be empty')

    switch (buf[0]) {
      case 0xc0:
        return null
      case 0xc2:
        return false
      case 0xc3:
        return true
      case 0xcc:
        // 1-byte unsigned int
        return buf[1]
      case 0xcd:
        // 2-bytes BE unsigned int
        return buf.readUInt16BE(1)
      case 0xce:
        // 4-bytes BE unsigned int
        return buf.readUInt32BE(1)
      case 0xcf:
        // 8-bytes BE unsigned int
        return buf.readUInt32BE(5) * 0xffffffff + buf.readUInt32BE(1)
      case 0xd0:
        // 1-byte signed int
        return buf.readInt8(1)
      case 0xd1:
        // 2-bytes signed int
        return buf.readInt16BE(1)
    }

    if (buf[0] > 0xe0) {
      // 5 bits negative ints
      return - (~0xe0 & buf[0])
    } else if (buf[0] < 0x80) {
      // 7-bits positive ints
      return buf[0]
    } else {
      throw new Error('not implemented yet')
    }
  }

  return {
    encode: encode,
    decode: decode
  }
}

function write64BitUint(buf, obj) {
  var big = Math.floor(obj / 0xffffffff)
  buf.writeUInt32BE(big, 5)
  buf.writeUInt32BE(obj - big * 0xffffffff, 1)
}

module.exports = msgpack
