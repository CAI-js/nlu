const { defaultContainer } = require('@caijs/container');
const LangDef = require('@caijs/lang-def');
const { arrayToObject } = require('./helper');
const NeuralNetwork = require('./neural-network');

class Nlu {
  constructor(settings = {}) {
    this.settings = settings;
    if (!this.settings.locale) {
      this.settings.locale = 'en';
    }
    if (this.settings.replaceEmojis === undefined) {
      this.settings.replaceEmojis = true;
    }
    if (this.settings.spellcheck === undefined) {
      this.settings.spellcheck = true;
    }
    if (this.settings.spellcheckDistance === undefined) {
      this.settings.spellcheckDistance = 1;
    }
    this.container = this.settings.container || defaultContainer;
    if (this.settings.useNoneFeature === undefined) {
      this.settings.useNoneFeature = false;
    }
    if (this.settings.filterZeros === undefined) {
      this.settings.filterZeros = true;
    }
  }

  ensurePlugins() {
    if (!this.language) {
      this.language =
        this.container.get(`lang-${this.settings.locale}`) || LangDef;
    }
    if (this.settings.replaceEmojis && !this.removeEmojis) {
      this.removeEmojis = this.container.get('removeEmojis');
    }
    if (this.settings.spellcheck && !this.spellchecker) {
      this.spellchecker = this.container.get('spellcheck');
    }
  }

  prepare(text) {
    if (Array.isArray(text)) {
      const result = [];
      for (let i = 0; i < text.length; i += 1) {
        result.push(this.prepare(text[i]));
      }
      return result;
    }
    if (typeof text === 'string') {
      this.ensurePlugins();
      if (this.settings.replaceEmojis && this.removeEmojis) {
        text = this.removeEmojis(text);
      }
      const stems = this.language.tokenizeAndStem(text);
      return arrayToObject(stems, true);
    }
    return text;
  }

  prepareCorpus(corpus) {
    this.features = {};
    this.intents = {};
    this.intentFeatures = {};
    const result = [];
    for (let i = 0; i < corpus.length; i += 1) {
      const { intent } = corpus[i];
      const item = {
        input: this.prepare(corpus[i].utterance),
        output: { [intent]: 1 },
      };
      const keys = Object.keys(item.input);
      if (!this.intentFeatures[intent]) {
        this.intentFeatures[intent] = {};
      }
      for (let j = 0; j < keys.length; j += 1) {
        this.features[keys[j]] = 1;
        this.intentFeatures[intent][keys[j]] = 1;
      }
      this.intents[intent] = 1;
      result.push(item);
    }
    const keys = Object.keys(this.intentFeatures);
    this.featuresToIntent = {};
    for (let i = 0; i < keys.length; i += 1) {
      const intent = keys[i];
      const features = Object.keys(this.intentFeatures[intent]);
      for (let j = 0; j < features.length; j += 1) {
        const feature = features[j];
        if (!this.featuresToIntent[feature]) {
          this.featuresToIntent[feature] = [];
        }
        this.featuresToIntent[feature].push(intent);
      }
      this.intentFeatures[keys[i]] = Object.keys(this.intentFeatures[keys[i]]);
    }
    if (this.spellchecker) {
      this.spellchecker.setFeatures(this.features);
    }
    this.numFeatures = Object.keys(this.features).length;
    this.numIntents = Object.keys(this.intents).length;
    return result;
  }

  addNoneFeature(corpus) {
    if (this.settings.useNoneFeature) {
      corpus.push({ input: { nonefeature: 1 }, output: { None: 1 } });
    }
  }

  calculateIntentArray() {
    this.intentsArr = Object.keys(this.intents);
  }

  train(corpus) {
    const processed = this.prepareCorpus(corpus);
    this.addNoneFeature(processed);
    this.calculateIntentArray();
    this.neuralNetwork = new NeuralNetwork(this.settings);
    return this.neuralNetwork.train(processed);
  }

  textToFeatures(tokens) {
    let unknownTokens = 0;
    const features = {};
    const keys = Object.keys(tokens);
    for (let i = 0; i < keys.length; i += 1) {
      const token = keys[i];
      if (token === 'nonefeature') {
        features[token] = 1;
      } else if (!this.features || !this.features[token]) {
        unknownTokens += 1;
      } else {
        features[token] = tokens[token];
      }
    }
    if (unknownTokens > 0) {
      features.nonefeature = 1;
    }
    return features;
  }

  innerProcess(features) {
    if (!this.neuralNetwork) {
      return { None: 1 };
    }
    return this.neuralNetwork.run(features);
  }

  someSimilar(tokensA, tokensB) {
    for (let i = 0; i < tokensB.length; i += 1) {
      if (tokensA[tokensB[i]]) {
        return true;
      }
    }
    return false;
  }

  getWhitelist(tokens) {
    const result = {};
    const features = Object.keys(tokens);
    for (let i = 0; i < features.length; i += 1) {
      const intents = this.featuresToIntent[features[i]];
      if (intents) {
        for (let j = 0; j < intents.length; j += 1) {
          result[intents[j]] = 1;
        }
      }
    }
    return result;
  }

  convertAndFilter(features, classifications) {
    const whitelist = this.getWhitelist(features);
    const result = [];
    let total = 0;
    for (let i = 0; i < this.intentsArr.length; i += 1) {
      const intent = this.intentsArr[i];
      const score =
        whitelist[intent] || intent === 'None' ? classifications[intent] : 0;
      if (score !== undefined && (score > 0 || !this.settings.filterZeros)) {
        const squareScore = score ** 2;
        total += squareScore;
        result.push({ intent, score: squareScore });
      }
    }
    if (total > 0) {
      for (let i = 0; i < result.length; i += 1) {
        result[i].score /= total;
      }
    }
    return result.sort((a, b) => b.score - a.score);
  }

  process(text) {
    if (this.neuralNetwork) {
      let tokens = this.prepare(text);
      if (this.spellchecker && this.settings.spellcheck) {
        tokens = this.spellchecker.check(
          tokens,
          this.settings.spellcheckDistance
        );
      }
      const features = this.textToFeatures(tokens);
      const classifications = this.innerProcess(features);
      return this.convertAndFilter(features, classifications);
    }
    return [{ intent: 'None', score: 1 }];
  }
}

module.exports = Nlu;
