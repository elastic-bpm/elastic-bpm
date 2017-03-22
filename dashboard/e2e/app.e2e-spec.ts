import { ElasticHomePage } from './app.po';

describe('elastic-home App', () => {
  let page: ElasticHomePage;

  beforeEach(() => {
    page = new ElasticHomePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
