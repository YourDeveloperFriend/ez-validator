import _ from 'lodash';
import Converter from '../src/converter';
import should from 'should';

describe('Converter', function() {
  describe('Converting fields', function() {
    let converter;
    beforeEach( ()=> converter = new Converter() );
    it('should convert an int', async function() {
      let data = {
        a: '5'
      };
      await converter.convertField({type: 'int'}, 'a', data);
      data.should.have.property('a', 5);
    });
    it('should convert a boolean', async function() {
      let data = {
        a: 'true',
        b: 'false'
      };
      await converter.convertField({type: 'boolean'}, 'a', data);
      await converter.convertField({type: 'boolean'}, 'b', data);
      data.should.have.property('a', true);
      data.should.have.property('b', false);
    });
    it('should convert an array', async function() {
      let data = {
        a: _.times(5, (i)=> '' + i )
      };
      await converter.convertField({type: ['int']}, 'a', data);
      data.should.have.property('a', _.times(5));
    });
    it('should convert a date', async function() {
      let date = new Date();
      let data = {
        a: date
      };
      await converter.convertField({type: 'date'}, 'a', data);
      data.should.have.property('a', date);
    });
    it('should be able to rename a field', async function() {
      let data = {
        a: '3'
      };
      await converter.convertField({type: 'int', rename: 'b'}, 'a', data);
      data.should.have.property('b', 3);
      data.should.not.have.property('a');
    });
    it('should be able to keep the original value', async function() {
      let data = {
        a: '3'
      };
      await converter.convertField({type: 'int', rename: 'b', keepOriginal: true}, 'a', data);
      data.should.have.property('b', 3);
      data.should.have.property('a', '3');
    });
  });
  describe('validating multiple', function() {
    it('should remove unallowed variables', async function() {
      let converter = new Converter();
      let data = {
        allowed: 5,
        notAllowed: 3
      };
      await converter.convertData({
        allowed: {type: 'int'}
      }, data);
      data.should.have.property('allowed');
      data.should.not.have.property('notAllowed');
    });
  });
  describe('custom validation', function() {
    it('should be able to use custom validation', async function() {
      let converter = new Converter({
        added: (val)=> parseInt(val) + 5
      });
      let data = {
        a: '3'
      };
      await converter.convertField({type: 'added'}, 'a', data);
      data.should.have.property('a', 8);
    });
    it('should be able to use on the fly validation', async function() {
      let converter = new Converter();
      let data = {
        a: 3
      };
      await converter.convertField({type: (val)=> val + 1}, 'a', data);
      data.should.have.property('a', 4);
    });
    it('should be to handle async', async function() {
      let converter = new Converter({
        async: (val)=> new Promise( (resolve)=> resolve(-val) )
      });
      let data = {a: 3};
      await converter.convertField({type: 'async'}, 'a', data);
      data.should.have.property('a', -3);
    });
  });
});
