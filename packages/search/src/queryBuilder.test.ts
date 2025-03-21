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
        OR: [{
          AND: [{
            colors: {
              has: 'r'
            }
          }]
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
        new Key('f'),
        new Operator(':'),
        new StringToken('vintage')
      ])
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      where: {
        OR: [{
          AND: [
            {
              colors: {
                has: 'r'
              }
            },
            {
              legalities: {
                some: {
                  format: 'vintage',
                  legal: true
                }
              }
            }
          ]
        }]
      }
    });
  });
});