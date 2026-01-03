export default class QuestionProvider {
  constructor(name) {
    this.name = name;
  }

  async getQuestion() {
    throw new Error('getQuestion not implemented');
  }
}
