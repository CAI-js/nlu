const NeuralNetwork = require('../src/neural-network');
const corpus = require('./corpus.json');

describe('Neural Network', () => {
  describe('Constructor', () => {
    test('Should create an instance', () => {
      const net = new NeuralNetwork();
      expect(net).toBeDefined();
    });

    test('If log setting is true should create a log function', () => {
      const net = new NeuralNetwork({ log: true });
      expect(typeof net.logFn).toEqual('function');
    });

    test('A log function can be provided', () => {
      const net = new NeuralNetwork({
        log: () => {
          net.logCalls = (net.logCalls || 0) + 1;
        },
      });
      expect(typeof net.logFn).toEqual('function');
    });
  });

  describe('Train', () => {
    test('Train and run', () => {
      const net = new NeuralNetwork();
      net.train(corpus);
      const actual = net.run({ when: 1, birthday: 1 });
      expect(actual.who).toEqual(0);
      expect(actual.developer).toEqual(0);
      expect(actual.birthday).toBeGreaterThan(0.75);
    });
    test('Train and run with fixed error', () => {
      const net = new NeuralNetwork({
        fixedError: true,
      });
      net.train(corpus);
      const actual = net.run({ when: 1, birthday: 1 });
      expect(actual.who).toEqual(0);
      expect(actual.developer).toEqual(0);
      expect(actual.birthday).toBeGreaterThan(0.75);
    });
    test('Train process can be logged', () => {
      const net = new NeuralNetwork({ log: true });
      net.train(corpus);
      const actual = net.run({ when: 1, birthday: 1 });
      expect(actual.who).toEqual(0);
      expect(actual.developer).toEqual(0);
      expect(actual.birthday).toBeGreaterThan(0.75);
    });
    test('Can be trained with none feature', () => {
      const net = new NeuralNetwork();
      net.train([
        ...corpus,
        { input: { nonefeature: 1 }, output: { None: 1 } },
      ]);
      const actual = net.run({ when: 1, birthday: 1 });
      expect(actual.who).toEqual(0);
      expect(actual.developer).toEqual(0);
      expect(actual.birthday).toBeGreaterThan(0.75);
    });
    test('If run is called without train return undefined', () => {
      const net = new NeuralNetwork();
      const actual = net.run({ when: 1, birthday: 1 });
      expect(actual).toBeUndefined();
    });
  });

  describe('Import and export', () => {
    test('Should export and import', () => {
      const net = new NeuralNetwork();
      net.train(corpus);
      const json = net.toJSON();
      const net2 = new NeuralNetwork();
      net2.fromJSON(json);
      const actual = net2.run({ when: 1, birthday: 1 });
      expect(actual.who).toEqual(0);
      expect(actual.developer).toEqual(0);
      expect(actual.birthday).toBeGreaterThan(0.75);
    });
  });
});
