import { lex } from '../parser';
import { BooleanOperator, Expression, Key, Operator, StringToken } from '../types';

describe('SearchParser', () => {
  it('should parse a simple field-value pair', () => {
    const tokens = lex('c:r');

    expect(tokens.tokens).toHaveLength(3);
    expect(tokens.tokens[0]).toBeInstanceOf(Key);
    expect(tokens.tokens[1]).toBeInstanceOf(Operator);
    expect(tokens.tokens[2]).toBeInstanceOf(StringToken);
  });

  it('should parse a grouped query', () => {
    const tokens = lex('(c:r f:vintage)');

    expect(tokens.tokens).toHaveLength(1);
    expect(tokens.tokens[0]).toBeInstanceOf(Expression);
    const innerTokens = (tokens.tokens[0] as Expression).tokens;
    expect(innerTokens).toHaveLength(6);
    expect(innerTokens[0]).toBeInstanceOf(Key);
    expect(innerTokens[1]).toBeInstanceOf(Operator);
    expect(innerTokens[2]).toBeInstanceOf(StringToken);
    expect(innerTokens[3]).toBeInstanceOf(Key);
    expect(innerTokens[4]).toBeInstanceOf(Operator);
    expect(innerTokens[5]).toBeInstanceOf(StringToken);
  });

  it('should handle multiple groups with OR', () => {
    const tokens = lex('(c:r f:vintage) OR (c:b f:legacy)');

    expect(tokens.tokens).toHaveLength(3);
    expect(tokens.tokens[0]).toBeInstanceOf(Expression);
    expect(tokens.tokens[1]).toBeInstanceOf(BooleanOperator);
    expect(tokens.tokens[2]).toBeInstanceOf(Expression);
  });

  // BAKERT test invalid/malformed queries
  // BAKERT test weird spacing
  // BAKERT test regex
  // BAKERT test quoted strings
  // BAKERT test nested groups
  // BAKERT test complex queries

});