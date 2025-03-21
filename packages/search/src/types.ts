export type TokenType = 'FIELD' | 'VALUE' | 'OPERATOR' | 'GROUP_START' | 'GROUP_END';

// BAKERT they all start with EXPECT_ so maybe lose that?
export const enum State {
  Expression = 'Expression',
  Operator = 'Operator',
  Term = 'Term',
  String = 'String',
  UnquotedString = 'UnquotedString',
  QuotedString = 'QuotedString',
  Regex = 'Regex',
}

export class InvalidSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSearchError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnexpectedTokenError';
  }
}

export class InvalidModeException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidModeException';
  }
}

export class KeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyError';
  }
}

export class Expression {
  tokens: Array<Expression | Token>;

  constructor(tokens: Array<Expression | Token>) {
    this.tokens = tokens;
  }
}

export abstract class Token {
  protected val: string = '';
  protected static values: string[] = [];

  static match(chars: string): boolean {
    return this.find(chars) !== '';
  }

  static tokenLength(chars: string): number {
    return this.find(chars).length;
  }

  static find(chars: string): string {
    const s = chars.toString();
    for (const value of this.values) {
      if (s.toLowerCase().startsWith(value.toLowerCase())) {
        return value;
      }
    }
    return '';
  }

  constructor(chars: string) {
    // Each derived class will set val in its own constructor
  }

  value(): string {
    return this.val;
  }

  isRegex(): boolean {
    return false;
  }

  toString(): string {
    return this.value();
  }
}

export class BooleanOperator extends Token {
  // Strict substrings of other operators must appear later in the list
  protected static values = ['AND', 'OR', 'NOT', '-'];

  constructor(chars: string) {
    super(chars);
    this.val = BooleanOperator.find(chars);
  }

  static find(chars: string): string {
    const s = chars.toString();
    for (const value of this.values) {
      if (s.toLowerCase().startsWith(value.toLowerCase() + ' ') ||
          (s.toLowerCase().startsWith(value.toLowerCase()) && s.length === value.length) ||
          (value === '-' && s.startsWith('-'))) {
        return value;
      }
    }
    return '';
  }

  value(): string {
    if (this.val === '-') {
      return 'NOT';
    }
    return this.val;
  }
}

export class Criterion extends Token {
  constructor(chars: string) {
    super(chars);
    this.val = Criterion.find(chars);
  }

  static match(chars: string): boolean {
    if (!Key.match(chars)) {
      return false;
    }
    const rest = chars.slice(Key.tokenLength(chars));
    if (!Operator.match(rest)) {
      return false;
    }
    return rest.length > 0;
  }
}

export class Key extends Token {
  // Strict substrings of other operators must appear later in the list
  protected static values = ['coloridentity', 'fulloracle', 'commander', 'supertype', 'toughness', 'identity', 'playable', 'produces', 'edition', 'subtype', 'loyalty', 'format', 'oracle', 'rarity', 'color', 'legal', 'power', 'super', 'mana', 'name', 'text', 'type', 'cmc', 'loy', 'pow', 'set', 'sub', 'tou', 'cid', 'not', 'ci', 'fo', 'id', 'mv', 'c', 'e', 'f', 'm', 'r', 's', 'o', 't', 'is', 'p'];

  constructor(chars: string) {
    super(chars);
    this.val = Key.find(chars);
  }
}

export class Operator extends Token {
  // Strict substrings of other operators must appear later in the list
  protected static values = ['<=', '>=', ':', '!', '<', '>', '='];

  constructor(chars: string) {
    super(chars);
    this.val = Operator.find(chars);
  }
}

export class StringToken extends Token {
  constructor(chars: string) {
    super(chars);
    this.val = StringToken.find(chars);
  }

  static find(chars: string): string {
    return chars;
  }

  toString(): string {
    return `"${this.val}"`;
  }
}

export class Regex extends StringToken {
  constructor(chars: string) {
    super(chars);
    this.val = Regex.find(chars);
  }

  isRegex(): boolean {
    return true;
  }

  toString(): string {
    return `/${this.val}/`;
  }
}


export interface SearchQuery {
  where: WhereClause;
}

export interface WhereClause {
  AND?: WhereClause[];
  OR?: WhereClause[];
  [key: string]: any;
}