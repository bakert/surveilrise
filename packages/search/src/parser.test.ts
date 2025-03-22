import { BooleanOperator, Expression, Key, Operator, StringToken, Regex, InvalidSearchError, InvalidTokenError} from './types';
import { parseQuery } from './parser';

describe('SearchParser', () => {
  it('should parse a simple field-value pair', () => {
    const expression = parseQuery('c:r');

    expect(expression.tokens).toHaveLength(3);
    expect(expression.tokens[0]).toBeInstanceOf(Key);
    expect(expression.tokens[1]).toBeInstanceOf(Operator);
    expect(expression.tokens[2]).toBeInstanceOf(StringToken);
  });

  it('should parse a grouped query', () => {
    const expression = parseQuery('(c:r f:vintage)');

    expect(expression.tokens).toHaveLength(1);
    expect(expression.tokens[0]).toBeInstanceOf(Expression);
    const innerTokens = (expression.tokens[0] as Expression).tokens;
    expect(innerTokens).toHaveLength(6);
    expect(innerTokens[0]).toBeInstanceOf(Key);
    expect(innerTokens[1]).toBeInstanceOf(Operator);
    expect(innerTokens[2]).toBeInstanceOf(StringToken);
    expect(innerTokens[3]).toBeInstanceOf(Key);
    expect(innerTokens[4]).toBeInstanceOf(Operator);
    expect(innerTokens[5]).toBeInstanceOf(StringToken);
  });

  it('should handle multiple groups with OR', () => {
    const expression = parseQuery('(c:r f:vintage) OR (c:b f:legacy)');

    expect(expression.tokens).toHaveLength(3);
    expect(expression.tokens[0]).toBeInstanceOf(Expression);
    expect(expression.tokens[1]).toBeInstanceOf(BooleanOperator);
    expect(expression.tokens[2]).toBeInstanceOf(Expression);
  });

  it('should parse a quoted string', () => {
    const expression = parseQuery('"quoted string"');

    expect(expression.tokens).toHaveLength(1);
    expect(expression.tokens[0]).toBeInstanceOf(StringToken);
    const token = expression.tokens[0] as StringToken;
    expect(token.value()).toBe('quoted string');
  });

  it('should parse an artist search', () => {
    const expression = parseQuery('artist:"john avon"');

    expect(expression.tokens).toHaveLength(3);
    expect(expression.tokens[0]).toBeInstanceOf(Key);
    expect(expression.tokens[1]).toBeInstanceOf(Operator);
    expect(expression.tokens[2]).toBeInstanceOf(StringToken);

    const artistToken = expression.tokens[0] as Key;
    const operatorToken = expression.tokens[1] as Operator;
    const valueToken = expression.tokens[2] as StringToken;

    expect(artistToken.value()).toBe('artist');
    expect(operatorToken.value()).toBe(':');
    expect(valueToken.value()).toBe('john avon');
  });


  it('should handle invalid/malformed queries by throwing', () => {
    expect(() => parseQuery('(')).toThrow(InvalidSearchError);
    expect(() => parseQuery(')')).toThrow(InvalidSearchError);
    expect(() => parseQuery('"unclosed quote')).toThrow(InvalidSearchError);
    expect(() => parseQuery('c:')).toThrow(InvalidSearchError);
    expect(() => parseQuery('((c:r)')).toThrow(InvalidSearchError);
    expect(() => parseQuery('(c:r))')).toThrow(InvalidSearchError);
    expect(() => parseQuery('(c:r (t:creature)')).toThrow(InvalidSearchError);
  });

  it('should handle weird spacing', () => {
    const expression = parseQuery('  c:r    f:vintage  ');

    expect(expression.tokens).toHaveLength(6);
    expect(expression.tokens[0]).toBeInstanceOf(Key);
    expect(expression.tokens[1]).toBeInstanceOf(Operator);
    expect(expression.tokens[2]).toBeInstanceOf(StringToken);
    expect(expression.tokens[3]).toBeInstanceOf(Key);
    expect(expression.tokens[4]).toBeInstanceOf(Operator);
    expect(expression.tokens[5]).toBeInstanceOf(StringToken);
  });

  it('should handle nested groups', () => {
    const expression = parseQuery('(c:r OR (t:creature power:3))');

    expect(expression.tokens).toHaveLength(1);
    expect(expression.tokens[0]).toBeInstanceOf(Expression);

    const outerExpr = expression.tokens[0] as Expression;
    expect(outerExpr.tokens).toHaveLength(5);
    expect(outerExpr.tokens[0]).toBeInstanceOf(Key);
    expect(outerExpr.tokens[1]).toBeInstanceOf(Operator);
    expect(outerExpr.tokens[2]).toBeInstanceOf(StringToken);
    expect(outerExpr.tokens[3]).toBeInstanceOf(BooleanOperator);
    expect(outerExpr.tokens[4]).toBeInstanceOf(Expression);

    const innerExpr = outerExpr.tokens[4] as Expression;
    expect(innerExpr.tokens).toHaveLength(6);
    expect(innerExpr.tokens[0]).toBeInstanceOf(Key);
    expect(innerExpr.tokens[1]).toBeInstanceOf(Operator);
    expect(innerExpr.tokens[2]).toBeInstanceOf(StringToken);
    expect(innerExpr.tokens[3]).toBeInstanceOf(Key);
    expect(innerExpr.tokens[4]).toBeInstanceOf(Operator);
    expect(innerExpr.tokens[5]).toBeInstanceOf(StringToken);

    const typeToken = innerExpr.tokens[0] as Key;
    const typeOp = innerExpr.tokens[1] as Operator;
    const typeValue = innerExpr.tokens[2] as StringToken;
    const powerToken = innerExpr.tokens[3] as Key;
    const powerOp = innerExpr.tokens[4] as Operator;
    const powerValue = innerExpr.tokens[5] as StringToken;

    expect(typeToken.value()).toBe('t');
    expect(typeOp.value()).toBe(':');
    expect(typeValue.value()).toBe('creature');
    expect(powerToken.value()).toBe('power');
    expect(powerOp.value()).toBe(':');
    expect(powerValue.value()).toBe('3');
  });
  it('should handle complex queries', () => {
    const expression = parseQuery('(c:r OR c:u) t:creature (power:3 OR toughness:3) -is:digital artist:"john avon"');

    expect(expression.tokens).toHaveLength(12);
    expect(expression.tokens[0]).toBeInstanceOf(Expression);
    expect(expression.tokens[1]).toBeInstanceOf(Key);
    expect(expression.tokens[2]).toBeInstanceOf(Operator);
    expect(expression.tokens[3]).toBeInstanceOf(StringToken);
    expect(expression.tokens[4]).toBeInstanceOf(Expression);
    expect(expression.tokens[5]).toBeInstanceOf(BooleanOperator);
    expect(expression.tokens[6]).toBeInstanceOf(Key);
    expect(expression.tokens[7]).toBeInstanceOf(Operator);
    expect(expression.tokens[8]).toBeInstanceOf(StringToken);
    expect(expression.tokens[9]).toBeInstanceOf(Key);
    expect(expression.tokens[10]).toBeInstanceOf(Operator);
    expect(expression.tokens[11]).toBeInstanceOf(StringToken);

    // Check first parenthetical expression (c:r OR c:u)
    const colorExpr = expression.tokens[0] as Expression;
    expect(colorExpr.tokens).toHaveLength(7);
    expect(colorExpr.tokens[0]).toBeInstanceOf(Key);
    expect(colorExpr.tokens[1]).toBeInstanceOf(Operator);
    expect(colorExpr.tokens[2]).toBeInstanceOf(StringToken);
    expect(colorExpr.tokens[3]).toBeInstanceOf(BooleanOperator);
    expect(colorExpr.tokens[4]).toBeInstanceOf(Key);
    expect(colorExpr.tokens[5]).toBeInstanceOf(Operator);
    expect(colorExpr.tokens[6]).toBeInstanceOf(StringToken);

    // Check second parenthetical expression (power:3 OR toughness:3)
    const statsExpr = expression.tokens[4] as Expression;
    expect(statsExpr.tokens).toHaveLength(7);
    expect(statsExpr.tokens[0]).toBeInstanceOf(Key);
    expect(statsExpr.tokens[1]).toBeInstanceOf(Operator);
    expect(statsExpr.tokens[2]).toBeInstanceOf(StringToken);
    expect(statsExpr.tokens[3]).toBeInstanceOf(BooleanOperator);
    expect(statsExpr.tokens[4]).toBeInstanceOf(Key);
    expect(statsExpr.tokens[5]).toBeInstanceOf(Operator);
    expect(statsExpr.tokens[6]).toBeInstanceOf(StringToken);

    const powerToken = statsExpr.tokens[0] as Key;
    const powerOp = statsExpr.tokens[1] as Operator;
    const powerValue = statsExpr.tokens[2] as StringToken;
    expect(powerToken.value()).toBe('power');
    expect(powerOp.value()).toBe(':');
    expect(powerValue.value()).toBe('3');

    const toughnessToken = statsExpr.tokens[4] as Key;
    const toughnessOp = statsExpr.tokens[5] as Operator;
    const toughnessValue = statsExpr.tokens[6] as StringToken;
    expect(toughnessToken.value()).toBe('toughness');
    expect(toughnessOp.value()).toBe(':');
    expect(toughnessValue.value()).toBe('3');
  });
});
