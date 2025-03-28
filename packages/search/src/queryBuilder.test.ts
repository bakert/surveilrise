import { QueryBuilder } from "./queryBuilder";
import { Expression, Key, StringToken, Operator } from "./types";

describe("QueryBuilder", () => {
  let builder: QueryBuilder;

  beforeEach(() => {
    builder = new QueryBuilder();
  });

  it("should build a simple field-value query", () => {
    const tokens = new Expression([
      new Key("c"),
      new Operator(":"),
      new StringToken("r"),
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      include: {
        printings: {
          where: {},
          orderBy: {
            releasedAt: "desc",
          },
        },
      },
      where: {
        AND: [
          {
            colors: {
              hasEvery: ["R"],
            },
          },
        ],
      },
    });
  });

  it("should build a grouped query", () => {
    const tokens = new Expression([
      new Expression([
        new Key("c"),
        new Operator(":"),
        new StringToken("r"),
        new Key("t"),
        new Operator(":"),
        new StringToken("pirate"),
      ]),
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      include: {
        printings: {
          where: {},
          orderBy: {
            releasedAt: "desc",
          },
        },
      },
      where: {
        AND: [
          {
            AND: [
              {
                colors: {
                  hasEvery: ["R"],
                },
              },
              {
                typeLine: {
                  contains: "pirate",
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
    });
  });

  it("should build an artist search", () => {
    const tokens = new Expression([
      new Key("a"),
      new Operator(":"),
      new StringToken("john avon"),
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      include: {
        printings: {
          where: {
            artist: {
              contains: "john avon",
              mode: "insensitive",
            },
          },
          orderBy: {
            releasedAt: "desc",
          },
        },
      },
      where: {
        AND: [
          {
            printings: {
              some: {
                artist: {
                  contains: "john avon",
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
    });
  });

  it("should build a complex OR query", () => {
    const tokens = new Expression([
      new Expression([
        new Key("c"),
        new Operator(":"),
        new StringToken("r"),
        new Key("t"),
        new Operator(":"),
        new StringToken("instant"),
      ]),
      new Operator("OR"),
      new Expression([
        new Key("c"),
        new Operator(":"),
        new StringToken("u"),
        new Key("t"),
        new Operator(":"),
        new StringToken("sorcery"),
      ]),
    ]);

    const query = builder.build(tokens);

    expect(query).toEqual({
      include: {
        printings: {
          where: {},
          orderBy: {
            releasedAt: "desc",
          },
        },
      },
      where: {
        AND: [
          {
            AND: [
              {
                colors: {
                  hasEvery: ["R"],
                },
              },
              {
                typeLine: {
                  contains: "instant",
                  mode: "insensitive",
                },
              },
            ],
          },
          {
            AND: [
              {
                colors: {
                  hasEvery: ["U"],
                },
              },
              {
                typeLine: {
                  contains: "sorcery",
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
    });
  });
});
