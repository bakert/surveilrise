import { Token, SearchQuery, Expression, Key, StringToken, BooleanOperator, Operator } from './types';

export class QueryBuilder {
  build(expression: Expression): SearchQuery {
    const query: SearchQuery = {
      where: {}
    };

    // Process tokens in order
    let i = 0;
    const tokens = expression.tokens;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token instanceof Expression) {
        // Recursively process nested expressions
        const subQuery = this.build(token);
        if (!query.where.AND) query.where.AND = [];
        query.where.AND.push(subQuery.where);
      }
      else if (token instanceof Key) {
        // Process key-operator-value triplet
        try {
          const operator = tokens[i + 1];
          const value = tokens[i + 2];
          if (!(operator instanceof Operator) || !(value instanceof StringToken)) {
            throw new Error('Invalid key-operator-value sequence');
          }
          const criterion = this.buildCriterion(token.value(), operator.value(), value.value());
          if (!query.where.AND) query.where.AND = [];
          query.where.AND.push(criterion);
          i += 2;
        } catch (e) {
          throw new Error('Invalid search expression');
        }
      }
      else if (token instanceof BooleanOperator) {
        if (i === 0) {
          throw new Error('Cannot start expression with boolean operator');
        }
        if (i === tokens.length - 1) {
          throw new Error('Cannot end expression with boolean operator');
        }
        // Handle OR operator by creating new OR array
        if (token.value() === 'or') {
          if (!query.where.OR) query.where.OR = [];
          const right = this.build(new Expression(tokens.slice(i + 1)));
          query.where.OR.push(query.where);
          query.where.OR.push(right.where);
          break;
        }
      }
      else if (token instanceof StringToken) {
        // Bare string token - search name
        if (!query.where.AND) query.where.AND = [];
        query.where.AND.push({
          name: {
            contains: token.value(),
            mode: 'insensitive'
          }
        });
      }

      i++;
    }

    return query;
  }

  private buildCriterion(field: string, operator: string, value: string): any {
    switch (field) {
      case 'c':
      case 'color':
        return this.buildColorQuery(operator, value);

      case 'f':
      case 'format':
        return {
          legalities: {
            some: {
              format: {
                equals: value,
                mode: 'insensitive'
              },
              status: {
                equals: 'legal'
              }
            }
          }
        };

      case 'o':
      case 'oracle':
        return {
          oracleText: {
            contains: value,
            mode: 'insensitive'
          }
        };

      case 't':
      case 'type':
        return {
          typeLine: {
            contains: value,
            mode: 'insensitive'
          }
        };

      case 'pow':
      case 'power':
        return {
          power: this.buildNumericComparison(operator, value)
        };

      case 'tou':
      case 'toughness':
        return {
          toughness: this.buildNumericComparison(operator, value)
        };

      case 'mv':
      case 'cmc':
        return {
          manaValue: this.buildNumericComparison(operator, value)
        };

      default:
        throw new Error(`Unknown field: ${field}`);
    }
  }

  private buildColorQuery(operator: string, colors: string): any {
    const colorSet = new Set(colors.split(''));

    switch(operator) {
      case ':':
      case '=':
        return {
          colors: {
            equals: Array.from(colorSet)
          }
        };

      case '>=':
        return {
          colors: {
            hasEvery: Array.from(colorSet)
          }
        };

      case '<=':
        return {
          colors: {
            hasSome: Array.from(colorSet),
            none: Array.from(['W','U','B','R','G'].filter(c => !colorSet.has(c)))
          }
        };

      default:
        throw new Error(`Invalid color operator: ${operator}`);
    }
  }

  private buildNumericComparison(operator: string, value: string): any {
    const num = parseInt(value);
    switch(operator) {
      case ':':
      case '=':
        return { equals: num };
      case '>':
        return { gt: num };
      case '>=':
        return { gte: num };
      case '<':
        return { lt: num };
      case '<=':
        return { lte: num };
      default:
        throw new Error(`Invalid numeric operator: ${operator}`);
    }
  }
}