const { defaultContainer, Container } = require('@caijs/container');
const LangDef = require('@caijs/lang-def');
const Nlu = require('../src/nlu');

const srccorpus = require('./corpus50.json');

const corpus = [];
for (let i = 0; i < srccorpus.data.length; i += 1) {
  const { intent, utterances } = srccorpus.data[i];
  for (let j = 0; j < utterances.length; j += 1) {
    corpus.push({ utterance: utterances[j], intent });
  }
}

describe('NLU', () => {
  describe('constructor', () => {
    it('Should create a new instance', () => {
      const nlu = new Nlu();
      expect(nlu).toBeDefined();
    });
    it('By default the locale should be "en"', () => {
      const nlu = new Nlu();
      expect(nlu.settings.locale).toEqual('en');
    });
    it('A locale can be provided', () => {
      const nlu = new Nlu({ locale: 'es' });
      expect(nlu.settings.locale).toEqual('es');
    });
    it('By default replace emojis should be true', () => {
      const nlu = new Nlu();
      expect(nlu.settings.replaceEmojis).toBeTruthy();
    });
    it('Replace emojis can be provided', () => {
      const nlu = new Nlu({ replaceEmojis: false });
      expect(nlu.settings.replaceEmojis).toBeFalsy();
    });
    it('By default spellcheck should be true', () => {
      const nlu = new Nlu();
      expect(nlu.settings.spellcheck).toBeTruthy();
    });
    it('Spellcheck can be provided', () => {
      const nlu = new Nlu({ spellcheck: false });
      expect(nlu.settings.spellcheck).toBeFalsy();
    });
    it('By default spellcheck distance should be 1', () => {
      const nlu = new Nlu();
      expect(nlu.settings.spellcheckDistance).toEqual(1);
    });
    it('Spellcheck distance can be provided', () => {
      const nlu = new Nlu({ spellcheckDistance: 2 });
      expect(nlu.settings.spellcheckDistance).toEqual(2);
    });
    it('Should use default container if not provided', () => {
      const nlu = new Nlu();
      expect(nlu.container).toBe(defaultContainer);
    });
    it('A container can be provided', () => {
      const container = new Container();
      const nlu = new Nlu({ container });
      expect(nlu.container).toBe(container);
    });
    it('By default should not use none feature', () => {
      const nlu = new Nlu();
      expect(nlu.settings.useNoneFeature).toBeFalsy();
    });
    it('Use none feature can be modified', () => {
      const nlu = new Nlu({ useNoneFeature: true });
      expect(nlu.settings.useNoneFeature).toBeTruthy();
    });
  });

  describe('Ensure plugins', () => {
    it('If lang plugin is not installed, then use default language', () => {
      const nlu = new Nlu();
      nlu.ensurePlugins();
      expect(nlu.language).toBe(LangDef);
    });
    it('A lang plugin can be defined', () => {
      const container = new Container();
      const langPlugin = { info: { name: 'lang-en' } };
      container.use(langPlugin);
      const nlu = new Nlu({ container });
      nlu.ensurePlugins();
      expect(nlu.language).toBe(langPlugin);
    });
    it('By default there is no remove emojis plugin', () => {
      const nlu = new Nlu();
      nlu.ensurePlugins();
      expect(nlu.removeEmojis).toBeUndefined();
    });
    it('I can register a removeEmojis plugin', () => {
      const container = new Container();
      const plugin = { info: { name: 'removeEmojis' } };
      container.use(plugin);
      const nlu = new Nlu({ container });
      nlu.ensurePlugins();
      expect(nlu.removeEmojis).toBe(plugin);
    });
    it('By default there is no spellcheck plugin', () => {
      const nlu = new Nlu();
      nlu.ensurePlugins();
      expect(nlu.spellchecker).toBeUndefined();
    });
    it('I can register a spellcheck plugin', () => {
      const container = new Container();
      const plugin = { info: { name: 'spellcheck' } };
      container.use(plugin);
      const nlu = new Nlu({ container });
      nlu.ensurePlugins();
      expect(nlu.spellchecker).toBe(plugin);
    });
  });
  describe('Prepare', () => {
    test('Prepare will generate an array of tokens', () => {
      const nlu = new Nlu();
      const input = 'Alli hay un raton';
      const actual = nlu.prepare(input);
      expect(actual).toEqual({
        alli: 1,
        hay: 1,
        un: 1,
        raton: 1,
      });
    });
    test('Prepare can process an array of strings', () => {
      const nlu = new Nlu();
      const input = ['Alli hay un raton', 'y vino el senor doctor'];
      const actual = nlu.prepare(input);
      expect(actual).toEqual([
        { alli: 1, hay: 1, un: 1, raton: 1 },
        { y: 1, vino: 1, el: 1, senor: 1, doctor: 1 },
      ]);
    });
  });

  describe('Prepare corpus', () => {
    test('It should convert strings to word objects', () => {
      const nlu = new Nlu();
      const actual = nlu.prepareCorpus(corpus);
      expect(actual).toHaveLength(250);
      expect(actual[0]).toEqual({
        input: { what: 1, does: 1, your: 1, company: 1, develop: 1 },
        output: { 'support.about': 1 },
      });
    });
  });

  describe('Add None Feature', () => {
    test('It should add a nonefeature input labeled as None', () => {
      const nlu = new Nlu({ useNoneFeature: true });
      const input = [];
      nlu.addNoneFeature(input);
      expect(input).toHaveLength(1);
      expect(input[0]).toEqual({
        input: { nonefeature: 1 },
        output: { None: 1 },
      });
    });
    test('It usenonefeature is false, do not modify corpus', () => {
      const nlu = new Nlu({ useNoneFeature: false });
      const input = [];
      nlu.addNoneFeature(input);
      expect(input).toHaveLength(0);
    });
  });

  describe('Train', () => {
    test('It can train a corpus', async () => {
      const nlu = new Nlu();
      const status = await nlu.train(corpus);
      expect(status.iterations).toEqual(26);
    });
  });
});
