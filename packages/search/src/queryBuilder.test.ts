import { QueryBuilder } from './queryBuilder';
import { Expression, Key, StringToken, Operator } from './types';

describe('QueryBuilder', () => {
  const builder = new QueryBuilder();

  it('should build a simple field-value query', () => {
    const tokens = new Expression([
      new Key('c'),
      new Operator(':'),
      new StringToken('r')
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      where: {
        AND: [{
          colors: {
            hasEvery: ['R']
          }
        }]
      }
    });
  });

  it('should build a grouped query', () => {
    const tokens = new Expression([
      new Expression([
        new Key('c'),
        new Operator(':'),
        new StringToken('r'),
        new Key('t'),
        new Operator(':'),
        new StringToken('pirate')
      ])
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      where: {
        AND: [
          {
            colors: {
              hasEvery: ['R']
            }
          },
          {
            typeLine: {
              contains: 'pirate',
              mode: 'insensitive'
            }
          }
        ]
      }
    });
  });
});