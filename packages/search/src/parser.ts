import { Token, Expression, State, Key, BooleanOperator, Criterion, Operator, StringToken, Regex, InvalidTokenError, InvalidSearchError, InvalidModeException, KeyError } from './types';

export function parseQuery(query: string): Expression {
  query = query.toLowerCase() + ' ';
  const tokens: { [depth: number]: Array<Expression | Token> } = { 0: [] };
  let depth = 0;
  let position = 0;
  let mode = State.Expression;
  let stringChars: string[] = [];

  while (position < query.length) {
    const char = query[position];
    const rest = query.slice(position);

    if (mode === State.Expression) {
      if (char === '(') {
        depth += 1;
        tokens[depth] = [];
      } else if (char === ')') {
        const expression = new Expression(tokens[depth]);
        delete tokens[depth];
        depth -= 1;
        tokens[depth].push(expression);
      } else if (Criterion.match(rest)) {
        tokens[depth].push(new Key(rest));
        mode = State.Operator;
        position += Key.tokenLength(rest) - 1;
      } else if (BooleanOperator.match(rest)) {
        tokens[depth].push(new BooleanOperator(rest));
        mode = State.Expression;
        position += BooleanOperator.tokenLength(rest) - 1;
      } else if (char === '"') {
        stringChars = [];
        mode = State.QuotedString;
      } else if (char === ' ') {
        // noop
      } else if (StringToken.match(char)) {
        stringChars = [char];
        mode = State.UnquotedString;
      } else {
        throw new InvalidTokenError(`Expected expression, got '${char}' at character ${position} in ${query}`);
      }
    } else if (mode === State.Operator) {
      if (Operator.match(rest)) {
        tokens[depth].push(new Operator(rest));
        mode = State.Term;
        position += Operator.tokenLength(rest) - 1;
      } else {
        throw new InvalidTokenError(`Expected operator, got '${char}' at character ${position} in ${query}`);
      }
    } else if (mode === State.Term) {
      if (char === '"') {
        stringChars = [];
        mode = State.QuotedString;
      } else if (char === '/') {
        stringChars = [];
        mode = State.Regex;
      } else {
        stringChars = [char];
        mode = State.UnquotedString;
      }
    } else if (mode === State.Regex) {
      if (char === '/') {
        tokens[depth].push(new Regex(stringChars.join('')));
        mode = State.Expression;
      } else {
        stringChars.push(char);
      }
    } else if (mode === State.QuotedString) {
      if (char === '"') {
        tokens[depth].push(new StringToken(stringChars.join('')));
        mode = State.Expression;
      } else {
        stringChars.push(char);
      }
    } else if (mode === State.UnquotedString) {
      if (char === ' ') {
        tokens[depth].push(new StringToken(stringChars.join('')));
        mode = State.Expression;
      } else if (char === ')') {
        tokens[depth].push(new StringToken(stringChars.join('')));
        mode = State.Expression;
        position -= 1;
      } else {
        stringChars.push(char);
      }
    } else {
      throw new InvalidModeException(`Bad mode '${char}' at character ${position} in ${query}`);
    }
    position += 1;
  }

  // BAKERT probably handle this without a try catch, or wrap the whole thing if necessary
  try {
    // Handle nesting validation
  } catch (e) {
    if (e instanceof KeyError) {
      throw new InvalidSearchError(`Invalid nesting in ${query}`);
    }
    throw e;
  }

  if (mode === State.QuotedString) {
    throw new InvalidSearchError(`Reached end of expression without finding the end of a quoted string in ${query}`);
  }
  if (mode === State.Regex) {
    throw new InvalidSearchError(`Reached end of expression without finding the end of a regular expression in ${query}`);
  }
  if (depth !== 0) {
    throw new InvalidSearchError(`Reached end of expression without finding enough closing parentheses in ${query}`);
  }

  return new Expression(tokens[0]);
}
