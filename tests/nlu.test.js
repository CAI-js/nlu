const { defaultContainer, Container } = require('@caijs/container');
const LangDef = require('@caijs/lang-def');
const Nlu = require('../src/nlu');

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
  });
});
