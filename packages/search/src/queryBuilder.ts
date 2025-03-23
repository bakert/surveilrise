import {
  SearchQuery,
  Expression,
  Key,
  StringToken,
  BooleanOperator,
  Operator,
  WhereClause,
} from "./types";

type NumericComparison = {
  equals?: number;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
};

type FieldQuery = {
  name?: {
    contains: string;
    mode: "insensitive";
  };
  legalities?: {
    some: {
      format: {
        equals: string;
        mode: "insensitive";
      };
      legal: boolean;
    };
  };
  oracleText?: {
    contains: string;
    mode: "insensitive";
  };
  typeLine?: {
    contains: string;
    mode: "insensitive";
  };
  powerValue?: NumericComparison;
  toughnessValue?: NumericComparison;
  manaValue?: NumericComparison;
  printings?: {
    some: {
      artist: {
        contains: string;
        mode: "insensitive";
      };
    };
  };
  colors?: {
    equals?: string[];
    hasEvery?: string[];
    hasSome?: string[];
    none?: string[];
  };
};

export class QueryBuilder {
  private printingsWhere: WhereClause = {};

  build(expression: Expression): SearchQuery {
    const query: SearchQuery = {
      where: {},
      include: {
        printings: {
          where: this.printingsWhere,
          orderBy: {
            releasedAt: "desc",
          },
        },
      },
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
        // Flatten the criteria from the subquery
        if (subQuery.where.AND) {
          query.where.AND.push(...subQuery.where.AND);
        }
      } else if (token instanceof Key) {
        // Process key-operator-value triplet
        try {
          const operator = tokens[i + 1];
          const value = tokens[i + 2];
          if (
            !(operator instanceof Operator) ||
            !(value instanceof StringToken)
          ) {
            throw new Error("Invalid key-operator-value sequence");
          }
          const criterion = this.buildCriterion(
            token.value(),
            operator.value(),
            value.value()
          );
          if (!query.where.AND) query.where.AND = [];
          query.where.AND.push(criterion);
          i += 2;
        } catch (e) {
          throw new Error("Invalid search expression");
        }
      } else if (token instanceof BooleanOperator) {
        if (i === 0) {
          throw new Error("Cannot start expression with boolean operator");
        }
        if (i === tokens.length - 1) {
          throw new Error("Cannot end expression with boolean operator");
        }
        // Handle OR operator by creating new OR array
        if (token.value() === "or") {
          if (!query.where.OR) query.where.OR = [];
          const right = this.build(new Expression(tokens.slice(i + 1)));
          query.where.OR.push(query.where);
          query.where.OR.push(right.where);
          break;
        }
      } else if (token instanceof StringToken) {
        // Bare string token - search name
        if (!query.where.AND) query.where.AND = [];
        query.where.AND.push({
          name: {
            contains: token.value(),
            mode: "insensitive",
          },
        });
      }

      i++;
    }

    // Update printings filter if one was set during query building
    if (this.printingsWhere) {
      if (!query.include) query.include = {};
      if (!query.include.printings) query.include.printings = {};
      query.include.printings.where = this.printingsWhere;
    }

    return query;
  }

  private buildCriterion(
    field: string,
    operator: string,
    value: string
  ): FieldQuery {
    switch (field) {
      case "c":
      case "color":
        return this.buildColorQuery(operator, value);

      case "f":
      case "format":
        return {
          legalities: {
            some: {
              format: {
                equals: value,
                mode: "insensitive",
              },
              legal: true,
            },
          },
        };

      case "o":
      case "oracle":
        return {
          oracleText: {
            contains: value,
            mode: "insensitive",
          },
        };

      case "t":
      case "type":
        return {
          typeLine: {
            contains: value,
            mode: "insensitive",
          },
        };

      case "pow":
      case "power":
        return {
          powerValue: this.buildNumericComparison(operator, value),
        };

      case "tou":
      case "toughness":
        return {
          toughnessValue: this.buildNumericComparison(operator, value),
        };

      case "mv":
      case "cmc":
        return {
          manaValue: this.buildNumericComparison(operator, value),
        };

      case "a":
      case "artist": {
        // For artist searches, add a where clause to printings to filter them
        const artistFilter = {
          artist: {
            contains: value,
            mode: "insensitive" as const,
          },
        };
        this.printingsWhere = artistFilter;
        return {
          printings: {
            some: artistFilter,
          },
        };
      }

      default:
        throw new Error(`Unknown field: ${field}`);
    }
  }

  private buildColorQuery(operator: string, colors: string): FieldQuery {
    const colorSet = new Set(colors.toUpperCase().split(""));

    switch (operator) {
      case "=":
        return {
          colors: {
            equals: Array.from(colorSet),
          },
        };

      case ":":
      case ">=":
        return {
          colors: {
            hasEvery: Array.from(colorSet),
          },
        };

      case "<=":
        return {
          colors: {
            hasSome: Array.from(colorSet),
            none: Array.from(
              ["W", "U", "B", "R", "G"].filter((c) => !colorSet.has(c))
            ),
          },
        };

      default:
        throw new Error(`Invalid color operator: ${operator}`);
    }
  }

  private buildNumericComparison(
    operator: string,
    value: string
  ): NumericComparison {
    const num = parseInt(value);
    switch (operator) {
      case ":":
      case "=":
        return { equals: num };
      case ">":
        return { gt: num };
      case ">=":
        return { gte: num };
      case "<":
        return { lt: num };
      case "<=":
        return { lte: num };
      default:
        throw new Error(`Invalid numeric operator: ${operator}`);
    }
  }
}
